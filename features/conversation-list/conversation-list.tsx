import { AnimatedVStack } from "@/design-system/VStack";
import { ConversationListItemDm } from "@/features/conversation-list/conversation-list-item/conversation-list-item-dm";
import { ConversationListItemGroup } from "@/features/conversation-list/conversation-list-item/conversation-list-item-group";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { useCallback, useRef } from "react";
import {
  FlatListProps,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";

type IConversationListProps = Omit<
  AnimatedProps<FlatListProps<ConversationWithCodecsType>>,
  "data" | "renderItem"
> & {
  conversations: ConversationWithCodecsType[];
  renderConversation?: ListRenderItem<ConversationWithCodecsType>;
  onRefetch?: () => Promise<void>;
};

export function ConversationList(props: IConversationListProps) {
  const {
    conversations,
    renderConversation = defaultRenderItem,
    onRefetch,
    ...rest
  } = props;

  const { theme } = useAppTheme();

  const { onScroll } = useRefreshHandler({
    onRefetch,
  });

  return (
    // @ts-expect-error
    <Animated.FlatList
      onScroll={onScroll}
      keyboardShouldPersistTaps="handled"
      alwaysBounceVertical={conversations?.length > 0}
      layout={theme.animation.reanimatedLayoutSpringTransition}
      itemLayoutAnimation={theme.animation.reanimatedLayoutSpringTransition}
      data={conversations}
      keyExtractor={keyExtractor}
      renderItem={(args) => (
        <AnimatedVStack
          entering={theme.animation.reanimatedFadeInSpring}
          exiting={theme.animation.reanimatedFadeOutSpring}
        >
          {renderConversation(args)}
        </AnimatedVStack>
      )}
      {...rest}
    />
  );
}

const defaultRenderItem: ListRenderItem<ConversationWithCodecsType> = ({
  item,
}) => {
  const conversation = item;
  if (isConversationGroup(conversation)) {
    return <ConversationListItemGroup conversationTopic={conversation.topic} />;
  }
  return <ConversationListItemDm conversationTopic={conversation.topic} />;
};

function keyExtractor(item: ConversationWithCodecsType) {
  if ("lastMessage" in item) {
    return item.topic;
  }
  return typeof item === "string" ? item : item.topic + "v2";
}

function useRefreshHandler(args: { onRefetch?: () => Promise<void> }) {
  const { onRefetch } = args;

  const isRefetchingRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    if (isRefetchingRef.current) return;
    isRefetchingRef.current = true;
    try {
      await onRefetch?.();
    } catch (error) {
      throw error;
    } finally {
      isRefetchingRef.current = false;
    }
  }, [onRefetch]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isRefetchingRef.current) return;
      // iOS has it's own bounce and search bar, so we need to set a different threshold
      // Android does not have a bounce, so this will never really get hit.
      const threshold = Platform.OS === "ios" ? -190 : 0;
      const isAboveThreshold = e.nativeEvent.contentOffset.y < threshold;
      if (isAboveThreshold) {
        handleRefresh();
      }
    },
    [handleRefresh]
  );

  return {
    onScroll,
    handleRefresh,
  };
}
