import { getCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";

type MessageFromCurrentUserPayload = {
  message: DecodedMessageWithCodecsType | undefined;
};

export function messageIsFromCurrentAccountInboxId({
  message,
}: MessageFromCurrentUserPayload) {
  return message?.senderInboxId.toLowerCase() === getCurrentAccountInboxId();
}
