import EventEmitter from "eventemitter3";
import { Account, Wallet } from "thirdweb/wallets";
import type { TransactionReceipt } from "viem";
import { IXmtpGroupWithCodecs } from "../features/xmtp/xmtp.types";

type ShowActionSheetEvent<T extends string> = `showActionSheetForTxRef-${T}`;
type OpenAttachmentMessage<T extends string> = `openAttachmentForMessage-${T}`;
type AttachmentMessageProcessed<T extends string> =
  `attachmentMessageProcessed-${T}`;

type ConverseEvents = {
  newGroup: (group: IXmtpGroupWithCodecs) => void;
  "enable-transaction-mode": (enabled: boolean) => void;
  toggleSpamRequests: () => void;
  displayExternalWalletPicker: (title?: string, subtitle?: string) => void;
  externalWalletPicked: (walletPicked: {
    wallet: Wallet | undefined;
    account: Account | undefined;
  }) => void;
  transactionResult: (id: string, receipt?: TransactionReceipt) => void;
};

type ShowActionSheetEvents = {
  [key in ShowActionSheetEvent<string>]: () => void;
};

type OpenAttachmentMessageEvents = {
  [key in OpenAttachmentMessage<string>]: () => void;
};

type AttachmentMessageProcessedEvents = {
  [key in AttachmentMessageProcessed<string>]: () => void;
};

type Events = ConverseEvents &
  ShowActionSheetEvents &
  OpenAttachmentMessageEvents &
  AttachmentMessageProcessedEvents;

export const converseEventEmitter = new EventEmitter<Events>();

export async function waitForConverseEvent<K extends keyof Events>(
  eventName: K,
): Promise<Parameters<Events[K]>> {
  return new Promise<Parameters<Events[K]>>((resolve) => {
    converseEventEmitter.once(eventName, (...args: unknown[]) => {
      resolve(args as Parameters<Events[K]>);
    });
  });
}
