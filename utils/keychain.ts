import { createHash } from "crypto";
import type { Storage as PrivyStorage } from "@privy-io/js-sdk-core";
import { logger } from "@utils/logger";
import { getRandomBytesAsync } from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

export const setSecureItemAsync = (key: string, value: string) =>
  SecureStore.setItemAsync(key, value, secureStoreOptions);

export const getSecureItemAsync = (key: string) =>
  SecureStore.getItemAsync(key, secureStoreOptions);

export const deleteSecureItemAsync = (key: string) =>
  SecureStore.deleteItemAsync(key, secureStoreOptions);

export const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.bundleId,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const saveXmtpKey = (account: string, base64Key: string) =>
  setSecureItemAsync(`XMTP_KEY_${account}`, base64Key);

export const deleteXmtpKey = async (account: string) => {
  await deleteSecureItemAsync(`XMTP_KEY_${account}`);
  logger.debug(`[Keychain] Deleted XMTP Key for account ${account}`);
};

export const loadXmtpKey = async (account: string): Promise<string | null> =>
  getSecureItemAsync(`XMTP_KEY_${account}`);
// export const getXmtpDatabaseEncryptionKey = async (
//   account: string
// ): Promise<string> => {
//   const existingKey = await getSecureItemAsync(
//     `XMTP_DB_ENCRYPTION_KEY_${account}`
//   );
//   if (existingKey) {
//     return existingKey;
//   }
//   logger.debug(`[Keychain] Creating db encryption key for account ${account}`);
//   const newKey = uuidv4();
//   await setSecureItemAsync(`XMTP_DB_ENCRYPTION_KEY_${account}`, newKey);
//   return newKey;
// };
// export const deleteXmtpDatabaseEncryptionKey = (account: string) =>
//   deleteSecureItemAsync(`XMTP_DB_ENCRYPTION_KEY_${account}`);

export const getTopicDataFromKeychain = async (
  account: string,
  topics: string[],
): Promise<string[]> => {
  const keys = topics.map((topic) =>
    createHash("sha256").update(topic).digest("hex"),
  );
  const keychainValues = await Promise.all(
    keys.map((key) => getSecureItemAsync(`XMTP_TOPIC_DATA_${account}_${key}`)),
  );
  const topicData = keychainValues.filter((v) => !!v) as string[];
  return topicData;
};

export const deleteConversationsFromKeychain = async (
  account: string,
  topics: string[],
) => {
  const promises: Promise<void>[] = [];
  for (const topic of topics) {
    const key = createHash("sha256").update(topic).digest("hex");
    promises.push(deleteSecureItemAsync(`XMTP_TOPIC_DATA_${account}_${key}`));
    // Delete old version of the data (TODO => remove)
    promises.push(deleteSecureItemAsync(`XMTP_CONVERSATION_${key}`));
  }
  await Promise.all(promises);
};

export const savePushToken = async (pushKey: string) => {
  await setSecureItemAsync("PUSH_TOKEN", pushKey);
};

export const privySecureStorage: PrivyStorage = {
  get: (key) => getSecureItemAsync(key.replaceAll(":", "-")),
  put: (key, val: string) => setSecureItemAsync(key.replaceAll(":", "-"), val),
  del: async (key) => deleteSecureItemAsync(key.replaceAll(":", "-")),
  getKeys: async () => [],
};

export const getDeviceId = async () => {
  const deviceId = await SecureStore.getItemAsync("CONVERSE_DEVICE_ID");
  if (deviceId) return deviceId;
  const newDeviceId = uuidv4();
  await SecureStore.setItemAsync("CONVERSE_DEVICE_ID", newDeviceId);
  return newDeviceId;
};
// Returns a 64 bytes key that can be used for multiple things
// 32 bytes is used for XMTP db encryption,
// 16 bytes is used for MMKV secure encryption

export const getAccountEncryptionKey = async (
  account: string,
): Promise<Buffer> => {
  const existingKey = await getSecureItemAsync(
    `CONVERSE_ACCOUNT_ENCRYPTION_KEY_${account}`,
  );
  if (existingKey) {
    return Buffer.from(existingKey, "base64");
  }
  logger.debug(
    `[Keychain] Creating account encryption key for account ${account}`,
  );
  const newKey = Buffer.from(await getRandomBytesAsync(64));
  await setSecureItemAsync(
    `CONVERSE_ACCOUNT_ENCRYPTION_KEY_${account}`,
    newKey.toString("base64"),
  );
  return newKey;
};
