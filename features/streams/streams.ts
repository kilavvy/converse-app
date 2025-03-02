import { logger } from "@utils/logger";
import { useEffect } from "react";
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store";
import { stopStreamingConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-stream";
import { stopStreamingAllMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages-stream";
import { stopStreamingConsent } from "@/features/xmtp/xmtp-preferences/xmtp-preferences-stream";
import { useAppStore } from "@/stores/app-store";
import { captureError } from "@/utils/capture-error";
import { startConversationStreaming } from "./stream-conversations";
import { startMessageStreaming } from "./stream-messages";
import { useStreamingStore } from "./stream-store";

// todo move this to multi-inbox-client
// when clients are added and removed; start and stop respective streams
export function useSetupStreamingSubscriptions() {
  // Start/stop streaming when internet connectivity changes
  // TODO: Fix this, we need to combine with the accounts store subscription below
  // useAppStore.subscribe(
  //   (state) => state.isInternetReachable,
  //   (isInternetReachable) => {
  //     logger.debug(
  //       `[Streaming] Internet reachability changed: ${isInternetReachable}`
  //     );
  //     if (!isInternetReachable) {
  //       return;
  //     }

  //     startStreaming(getAccountsList());
  //   }
  // );

  // Start streaming for all senders on first render
  useEffect(() => {
    const senders = useMultiInboxStore.getState().senders;
    startStreaming(senders.map((sender) => sender.ethereumAddress));
  }, []);

  useEffect(() => {
    const unsubscribe = useMultiInboxStore.subscribe(
      (state) => [state.senders] as const,
      ([senders], [previousSenders]) => {
        const { isInternetReachable } = useAppStore.getState();

        if (!isInternetReachable) {
          return;
        }

        const previousAddresses = previousSenders.map(
          (sender) => sender.ethereumAddress,
        );

        const currentAddresses = senders.map(
          (sender) => sender.ethereumAddress,
        );

        // Start streaming for new senders
        const newAddresses = currentAddresses.filter(
          (address) => !previousAddresses.includes(address),
        );

        if (newAddresses.length > 0) {
          startStreaming(newAddresses);
        }

        // Stop streaming for removed senders
        const removedAddresses = previousAddresses.filter(
          (address) => !currentAddresses.includes(address),
        );

        if (removedAddresses.length > 0) {
          stopStreaming(removedAddresses);
        }
      },
      {
        fireImmediately: true,
      },
    );

    return () => unsubscribe();
  }, []);
}

async function startStreaming(accountsToStream: string[]) {
  const store = useStreamingStore.getState();

  for (const account of accountsToStream) {
    const streamingState = store.accountStreamingStates[account];

    if (!streamingState?.isStreamingConversations) {
      logger.info(`[Streaming] Starting conversation stream for ${account}`);
      try {
        store.actions.updateStreamingState(account, {
          isStreamingConversations: true,
        });
        await startConversationStreaming(account);
      } catch (error) {
        store.actions.updateStreamingState(account, {
          isStreamingConversations: false,
        });
        captureError(error);
      }
    }

    if (!streamingState?.isStreamingMessages) {
      logger.info(`[Streaming] Starting messages stream for ${account}`);
      try {
        store.actions.updateStreamingState(account, {
          isStreamingMessages: true,
        });
        await startMessageStreaming({ account });
      } catch (error) {
        store.actions.updateStreamingState(account, {
          isStreamingMessages: false,
        });
        captureError(error);
      }
    }

    // TODO: Fix and handle the consent stream. I think needed for notifications
    // if (!streamingState?.isStreamingConsent) {
    //   logger.info(`[Streaming] Starting consent stream for ${account}`);
    //   try {
    //     store.actions.updateStreamingState(account, {
    //       isStreamingConsent: true,
    //     });
    //     await startConsentStreaming(account);
    //   } catch (error) {
    //     store.actions.updateStreamingState(account, {
    //       isStreamingConsent: false,
    //     });
    //     captureError(error);
    //   }
    // }
  }
}

async function stopStreaming(accounts: string[]) {
  const store = useStreamingStore.getState();

  await Promise.all(
    accounts.map(async (account) => {
      try {
        await Promise.all([
          stopStreamingAllMessage({ ethAddress: account }),
          stopStreamingConversations({ ethAddress: account }),
          stopStreamingConsent(account),
        ]);
      } finally {
        store.actions.resetAccount(account);
      }
    }),
  );
}
