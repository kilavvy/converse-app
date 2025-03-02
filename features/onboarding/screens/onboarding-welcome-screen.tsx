import { memo, useCallback, useEffect } from "react";
import { Button, TextStyle } from "react-native";
import { Screen } from "@/components/screen/screen";
import { showSnackbar } from "@/components/snackbar/snackbar.service";
import { Center } from "@/design-system/Center";
import { Loader } from "@/design-system/loader";
import { Pressable } from "@/design-system/Pressable";
import { AnimatedText, Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store";
import { useLogout } from "@/features/authentication/use-logout";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { useLoginWithPasskey } from "@/features/onboarding/hooks/use-login-with-passkey";
import { useSignupWithPasskey } from "@/features/onboarding/hooks/use-signup-with-passkey";
import { $globalStyles } from "@/theme/styles";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { captureErrorWithToast } from "@/utils/capture-error";

export const OnboardingWelcomeScreen = memo(function OnboardingWelcomeScreen() {
  const { themed, theme } = useAppTheme();

  const { logout } = useLogout();

  const { signup, isSigningUp } = useSignupWithPasskey();
  const { login, isLoggingIn } = useLoginWithPasskey();

  // Safer to fully logout when we're here
  useEffect(() => {
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignup = useCallback(async () => {
    try {
      // If the user decides to sign up again, make sure we're fully logged out
      await logout();

      const { inboxId, ethereumAddress } = await signup();
      useMultiInboxStore.getState().actions.addSender({
        inboxId,
        ethereumAddress,
      });
      useMultiInboxStore.getState().actions.setCurrentSender({
        ethereumAddress,
        inboxId,
      });
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error signing up with passkey",
      });
    }
  }, [signup, logout]);

  const handleLogin = useCallback(async () => {
    try {
      const { inboxId, ethereumAddress } = await login();
      useMultiInboxStore.getState().actions.addSender({
        inboxId,
        ethereumAddress,
      });
      useMultiInboxStore.getState().actions.setCurrentSender({
        ethereumAddress,
        inboxId,
      });
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error signing in with passkey",
      });
    }
  }, [login]);

  const handleReset = useCallback(async () => {
    try {
      await logout();
      showSnackbar({
        message: "State reset. You can now sign in again",
      });
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error resetting state. Please close the app and try again",
      });
    }
  }, [logout]);

  return (
    <>
      <Screen
        contentContainerStyle={$globalStyles.flex1}
        safeAreaEdges={["bottom"]}
        preset="scroll"
      >
        <Center style={$globalStyles.flex1}>
          <VStack>
            <OnboardingSubtitle>Welcome to Convos</OnboardingSubtitle>
            <OnboardingTitle style={themed($titleStyle)}>
              Not another chat app
            </OnboardingTitle>
            <AnimatedText style={$subtextStyle} color={"secondary"}>
              Super secure · Decentralized · Universal
            </AnimatedText>
          </VStack>
        </Center>

        {/* The whole loading state and this UI/UX is temporary */}
        <VStack
          style={{
            height: 100,
          }}
        >
          {isSigningUp || isLoggingIn ? (
            <Center style={$globalStyles.flex1}>
              <Loader />
            </Center>
          ) : (
            <>
              <Button onPress={handleSignup} title="Signup with Passkey" />
              <Button onPress={handleLogin} title="Sign in with Passkey" />
            </>
          )}
        </VStack>

        <Center
          style={{
            paddingHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.lg,
          }}
        >
          <Pressable onPress={handleReset}>
            <Text
              preset="smaller"
              color="secondary"
              style={{
                textAlign: "center",
              }}
            >
              Press me to clear stuff and restart{"\n"}(use this if you get in a
              funky state)
            </Text>
          </Pressable>
        </Center>
      </Screen>

      {/* <ConnectWalletBottomSheet
          isVisible={isVisible}
          onClose={() => {
            setIsVisible(false);
          }}
          onWalletImported={() => {}}
        /> */}
    </>
  );
});

const $subtextStyle: TextStyle = {
  textAlign: "center",
};

const $titleStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
});
