import { logger } from "@/utils/logger";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";

export type AccountCanMessagePeerArgs = {
  peer: string;
  account: string;
};

export const accountCanMessagePeer = async (
  args: AccountCanMessagePeerArgs
) => {
  const { peer, account } = args;
  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });

  if (!client) {
    throw new Error("Client not found");
  }

  logger.debug(`[XMTPRN Conversations] Checking if can message ${peer}`);
  const start = new Date().getTime();

  const canMessage = await client.canMessage([peer]);

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Checked if can message ${peer} in ${
      (end - start) / 1000
    } sec`
  );

  return canMessage[peer.toLowerCase()];
};
