import { experimental_createPersister } from "@tanstack/react-query-persist-client";
import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";
import { config } from "@/config";
import { DEFAULT_GC_TIME } from "@/queries/queryClient.constants";
import { getAccountEncryptionKey } from "./keychain";
import logger from "./logger";

const storage = new MMKV();

export default storage;

export const zustandMMKVStorage: StateStorage = {
  setItem(name, value) {
    // Deleting before setting to avoid memory leak
    // https://github.com/mrousavy/react-native-mmkv/issues/440
    storage.delete(name);
    return storage.set(name, value);
  },
  getItem(name) {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem(name) {
    return storage.delete(name);
  },
};

export const secureMmkvByAccount: { [account: string]: MMKV } = {};

export const getSecureMmkvForAccount = async (account: string) => {
  if (secureMmkvByAccount[account]) return secureMmkvByAccount[account];
  const encryptionKey = await getAccountEncryptionKey(account);
  const mmkvStringEncryptionKey = encryptionKey.toString("base64").slice(0, 16);

  secureMmkvByAccount[account] = new MMKV({
    id: `secure-mmkv-${account}`,
    encryptionKey: mmkvStringEncryptionKey,
  });
  return secureMmkvByAccount[account];
};

export const clearSecureMmkvForAccount = async (account: string) => {
  try {
    const instance = await getSecureMmkvForAccount(account);
    instance.clearAll();
  } catch (e) {
    logger.error(e);
  }
  delete secureMmkvByAccount[account];
};

export const reactQueryMMKV = new MMKV({ id: "converse-react-query" });
export const secureQueryMMKV = new MMKV({
  id: "secure-convos-react-query",
  encryptionKey: config.reactQueryEncryptionKey,
});

type MaybePromise<T> = T | Promise<T>;

type PersistStorage<TStorageValue = string> = {
  getItem: (key: string) => MaybePromise<TStorageValue | undefined | null>;
  setItem: (key: string, value: TStorageValue) => MaybePromise<unknown>;
  removeItem: (key: string) => MaybePromise<void>;
};

type MMKVReactQueryStorage = PersistStorage & {
  clearAll(): void;
};

function createMMKVStorage(storage: MMKV): MMKVReactQueryStorage {
  return {
    getItem: (key: string) => {
      const stringValue = storage.getString(key);
      return stringValue ?? null;
    },
    setItem: (key: string, value: string) => {
      // Deleting before setting to avoid memory leak
      // relevant only until we upgrade to v3 of react-native-mmkv
      // https://github.com/mrousavy/react-native-mmkv/issues/440#issuecomment-2345737896
      storage.delete(key);
      if (value) {
        storage.set(key, value);
      }
    },
    removeItem: (key: string) => storage.delete(key),
    clearAll: () => storage.clearAll(),
  };
}

export const reactQueryPersister = experimental_createPersister({
  storage: createMMKVStorage(reactQueryMMKV),
  maxAge: DEFAULT_GC_TIME,
});

export const secureQueryPersister = experimental_createPersister({
  storage: createMMKVStorage(secureQueryMMKV),
});
