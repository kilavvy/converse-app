import { ReactionCodec } from "@xmtp/content-type-reaction";
import { ReadReceiptCodec } from "@xmtp/content-type-read-receipt";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { Client } from "@xmtp/xmtp-js";

import config from "../../config";
import { getCleanAddress } from "../eth";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpClientFromBase64Key = async (base64Key: string) => {
  const client = await Client.create(null, {
    env,
    privateKeyOverride: Buffer.from(base64Key, "base64"),
  });
  client.registerCodec(new ReactionCodec());
  client.registerCodec(new AttachmentCodec());
  client.registerCodec(new RemoteAttachmentCodec());
  client.registerCodec(new ReadReceiptCodec());
  return client;
};

export const xmtpClientByAccount: {
  [account: string]: Client;
} = {};

export const isOnXmtp = async (address: string) =>
  Client.canMessage(getCleanAddress(address), {
    env,
  });
