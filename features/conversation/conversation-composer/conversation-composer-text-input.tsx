import { textSizeStyles } from "@design-system/Text/Text.styles";
import { useAppTheme } from "@theme/useAppTheme";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { Platform, TextInput as RNTextInput } from "react-native";
import { useConversationComposerStore } from "./conversation-composer.store-context";

export const ConversationComposerTextInput = memo(
  function ConversationComposerTextInput(props: {
    onSubmitEditing: () => Promise<void>;
  }) {
    const { onSubmitEditing } = props;

    const inputRef = useRef<RNTextInput>(null);

    const { theme } = useAppTheme();

    const store = useConversationComposerStore();
    const inputDefaultValue = store.getState().inputValue;

    const handleChangeText = useCallback(
      (text: string) => {
        store.setState((state) => ({
          ...state,
          inputValue: text,
        }));
      },
      [store]
    );

    // If we clear the input (i.e after sending a message)
    // we need to clear the input value in the text input
    // Doing this since we are using a uncontrolled component
    useEffect(() => {
      const unsubscribe = store.subscribe((state, prevState) => {
        if (prevState.inputValue && !state.inputValue) {
          inputRef.current?.clear();
        }
      });

      return () => unsubscribe();
    }, [store]);

    const handleSubmitEditing = useCallback(() => {
      onSubmitEditing();
    }, [onSubmitEditing]);

    return (
      <RNTextInput
        style={{
          ...textSizeStyles.sm,
          color: theme.colors.text.primary,
          flex: 1,
          paddingHorizontal: theme.spacing.xs,
          paddingVertical:
            theme.spacing.xxs -
            // Because we input container to be exactly 36 pixels and borderWidth add with total height in react-native
            theme.borderWidth.sm,
        }}
        onKeyPress={(event: any) => {
          // Maybe want a better check here, but web/tablet is not the focus right now
          if (Platform.OS !== "web") {
            return;
          }

          if (
            event.nativeEvent.key === "Enter" &&
            !event.altKey &&
            !event.metaKey &&
            !event.shiftKey
          ) {
            event.preventDefault();
            onSubmitEditing();
          }
        }}
        ref={inputRef}
        onSubmitEditing={handleSubmitEditing}
        onChangeText={handleChangeText}
        multiline
        defaultValue={inputDefaultValue}
        placeholder="Message"
        placeholderTextColor={theme.colors.text.tertiary}
      />
    );
  }
);
