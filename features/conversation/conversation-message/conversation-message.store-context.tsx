/**
 * This store/context is to avoid prop drilling in message components.
 */

import { isGroupUpdatedMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { hasNextMessageInSeries } from "@/features/conversation/utils/has-next-message-in-serie";
import { hasPreviousMessageInSeries } from "@/features/conversation/utils/has-previous-message-in-serie";
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user";
import { messageShouldShowDateChange } from "@/features/conversation/utils/message-should-show-date-change";
import { convertNanosecondsToMilliseconds } from "@/utils/date";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { InboxId, MessageId } from "@xmtp/react-native-sdk";
import { createContext, memo, useContext, useEffect, useRef } from "react";
import { createStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type IMessageContextStoreProps = {
  message: DecodedMessageWithCodecsType;
  previousMessage: DecodedMessageWithCodecsType | undefined;
  nextMessage: DecodedMessageWithCodecsType | undefined;
};

type IMessageContextStoreState = IMessageContextStoreProps & {
  messageId: MessageId;
  hasNextMessageInSeries: boolean;
  hasPreviousMessageInSeries: boolean;
  fromMe: boolean;
  sentAt: number;
  showDateChange: boolean;
  senderInboxId: InboxId;
  isShowingTime: boolean;
  isSystemMessage: boolean;
};

type IMessageContextStoreProviderProps =
  React.PropsWithChildren<IMessageContextStoreProps>;

type IMessageContextStore = ReturnType<typeof createMessageContextStore>;

export const MessageContextStoreProvider = memo(
  ({ children, ...props }: IMessageContextStoreProviderProps) => {
    const storeRef = useRef<IMessageContextStore>();

    if (!storeRef.current) {
      storeRef.current = createMessageContextStore(props);
    }

    // Make sure to update the store if a props change
    useEffect(() => {
      storeRef.current?.setState({
        ...getStoreStateBasedOnProps(props),
      });
    }, [props]);

    return (
      <MessageContextStoreContext.Provider value={storeRef.current}>
        {children}
      </MessageContextStoreContext.Provider>
    );
  }
);

function getStoreStateBasedOnProps(props: IMessageContextStoreProps) {
  return {
    ...props,
    messageId: props.message.id as MessageId,
    hasNextMessageInSeries: hasNextMessageInSeries({
      currentMessage: props.message,
      nextMessage: props.nextMessage,
    }),
    hasPreviousMessageInSeries: hasPreviousMessageInSeries({
      currentMessage: props.message,
      previousMessage: props.previousMessage,
    }),
    fromMe: messageIsFromCurrentAccountInboxId({
      message: props.message,
    }),
    showDateChange: messageShouldShowDateChange({
      message: props.message,
      previousMessage: props.previousMessage,
    }),
    sentAt: convertNanosecondsToMilliseconds(props.message.sentNs),
    senderInboxId: props.message.senderInboxId,
    isShowingTime: false,
    isSystemMessage: isGroupUpdatedMessage(props.message),
  };
}

const createMessageContextStore = (initProps: IMessageContextStoreProps) => {
  return createStore<IMessageContextStoreState>()(
    subscribeWithSelector((set) => getStoreStateBasedOnProps(initProps))
  );
};

const MessageContextStoreContext = createContext<IMessageContextStore | null>(
  null
);

export function useMessageContextStoreContext<T>(
  selector: (state: IMessageContextStoreState) => T
): T {
  const store = useContext(MessageContextStoreContext);
  if (!store)
    throw new Error("Missing MessageContextStore.Provider in the tree");
  return useStore(store, selector);
}

export function useMessageContextStore() {
  const store = useContext(MessageContextStoreContext);
  if (!store)
    throw new Error(`Missing MessageContextStore.Provider in the tree`);
  return store;
}
