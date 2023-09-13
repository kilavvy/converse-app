import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { getExistingDataSource } from "../data/db/datasource";
import {
  getAccountsList,
  getChatStore,
  getSettingsStore,
  useAccountsList,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { getBlockedPeers } from "../utils/api";
import { pick } from "../utils/objects";
import { syncXmtpClient } from "../utils/xmtpRN/client";
import { createPendingConversations } from "../utils/xmtpRN/conversations";
import { sendPendingMessages } from "../utils/xmtpRN/send";

export default function XmtpEngine() {
  const appState = useRef(AppState.currentState);
  const accounts = useAccountsList();
  const syncedAccounts = useRef<{ [account: string]: boolean }>({});
  const { hydrationDone, isInternetReachable } = useAppStore((s) =>
    pick(s, ["hydrationDone", "isInternetReachable"])
  );

  const syncAccounts = useCallback((accountsToSync: string[]) => {
    accountsToSync.forEach((a) => {
      syncedAccounts.current[a] = true;
      const knownTopics = Object.keys(getChatStore(a).getState().conversations);
      const lastSyncedAt = getChatStore(a).getState().lastSyncedAt;
      syncXmtpClient(a, knownTopics, lastSyncedAt);
    });
  }, []);

  // Sync accounts on load and when a new one is added
  useEffect(() => {
    // Let's remove accounts that dont exist anymore from ref
    Object.keys(syncedAccounts.current).forEach((account) => {
      if (!accounts.includes(account)) {
        delete syncedAccounts.current[account];
      }
    });
    if (hydrationDone) {
      const unsyncedAccounts = accounts.filter(
        (a) => !syncedAccounts.current[a]
      );
      syncAccounts(unsyncedAccounts);
      // Sync blocked peers as well
      unsyncedAccounts.map((a) =>
        getBlockedPeers(a).then((addresses) => {
          getSettingsStore(a).getState().setBlockedPeers(addresses);
        })
      );
    }
  }, [accounts, syncAccounts, hydrationDone]);

  // When app back active, resync all, in case we lost sync
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/) &&
          hydrationDone
        ) {
          syncAccounts(accounts);
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [syncAccounts, accounts, hydrationDone]);

  // If lost connection, resync
  const isInternetReachableRef = useRef(isInternetReachable);
  useEffect(() => {
    if (
      !isInternetReachableRef.current &&
      isInternetReachable &&
      hydrationDone
    ) {
      // We're back online!
      syncAccounts(accounts);
    }
    isInternetReachableRef.current = isInternetReachable;
  }, [accounts, isInternetReachable, syncAccounts, hydrationDone]);

  // Cron

  const lastCronTimestamp = useRef(0);
  const runningCron = useRef(false);

  const xmtpCron = useCallback(async () => {
    if (!useAppStore.getState().splashScreenHidden) {
      return;
    }
    runningCron.current = true;
    const accounts = getAccountsList();
    for (const account of accounts) {
      if (
        getChatStore(account).getState().localClientConnected &&
        getChatStore(account).getState().initialLoadDone &&
        getExistingDataSource(account)
      ) {
        try {
          await createPendingConversations(account);
          await sendPendingMessages(account);
        } catch (e) {
          console.log(e);
        }
      }
    }
    lastCronTimestamp.current = new Date().getTime();
    runningCron.current = false;
  }, []);

  useEffect(() => {
    // Launch cron
    const interval = setInterval(() => {
      if (runningCron.current) return;
      const now = new Date().getTime();
      if (now - lastCronTimestamp.current > 1000) {
        xmtpCron();
      }
    }, 300);

    return () => clearInterval(interval);
  }, [xmtpCron]);

  return null;
}
