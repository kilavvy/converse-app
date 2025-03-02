// import React from "react";
// import { ScrollView } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { base } from "thirdweb/chains";
// import { useConnect } from "thirdweb/react";
// import { createWallet, WalletId } from "thirdweb/wallets";
// import { config } from "@/config";
// import { useBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";
// import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
// import { BottomSheetHeader } from "@/design-system/BottomSheet/BottomSheetHeader";
// import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
// import { Button } from "@/design-system/Button/Button";
// import { Text } from "@/design-system/Text";
// import { VStack } from "@/design-system/VStack";
// import { ensureSocialProfilesQueryData } from "@/features/social-profiles/social-lookup.query";
// import {
//   ISupportedWallet,
//   useInstalledWallets,
// } from "@/features/wallets/use-installed-wallets.hook";
// import { getXmtpClientByEthAddress } from "@/features/xmtp/xmtp-client/xmtp-client.service";
// import { useAppTheme } from "@/theme/use-app-theme";
// import { logger } from "@/utils/logger";
// import { thirdwebClient } from "@/utils/thirdweb";
// import {
//   useCurrentSender,
//   useMultiInboxStore,
// } from "../authentication/multi-inbox.store";
// import { ISocialProfile } from "../social-profiles/social-lookup.api";
// import { IXmtpSigner } from "../xmtp/xmtp.types";

// type InstalledWalletsListProps = {
//   installedWallets: ISupportedWallet[];
//   onWalletTapped: (walletId: WalletId, options?: any) => void;
//   coinbaseCallbackUrl: string;
//   isDisabled: boolean;
//   loadingWalletId: WalletId | undefined;
// };

// type SocialIdentityListProps = {
//   socialData: ISocialProfile[];
//   onSocialIdentityTapped: (socialIdentity: ISocialProfile) => void;
// };

// function SocialIdentityList({
//   socialData,
//   onSocialIdentityTapped,
// }: SocialIdentityListProps) {
//   return (
//     <>
//       <ScrollView>
//         {socialData?.map((social) => (
//           <Button
//             key={`${social.name}-${social.type}`}
//             text={JSON.stringify(social, null, 2)}
//             onPress={() => onSocialIdentityTapped(social)}
//           />
//         ))}
//       </ScrollView>
//     </>
//   );
// }

// function InstalledWalletsList({
//   installedWallets,
//   onWalletTapped,
//   coinbaseCallbackUrl,
//   isDisabled,
//   loadingWalletId,
// }: InstalledWalletsListProps) {
//   return (
//     <>
//       <Text>Installed Wallets</Text>
//       {installedWallets.map((wallet) => {
//         const isLoading = loadingWalletId === wallet.thirdwebId;
//         return (
//           <Button
//             loading={isLoading}
//             disabled={isDisabled}
//             key={wallet.thirdwebId}
//             // text={`Add ${wallet.name} to inbox (${
//             //   isLoading ? "loading..." : ""
//             // })`}
//             onPress={() =>
//               onWalletTapped(wallet.thirdwebId, {
//                 mobileConfig: { callbackURL: coinbaseCallbackUrl },
//               })
//             }
//           />
//         );
//       })}
//     </>
//   );
// }

// type ConnectWalletBottomSheetProps = {
//   isVisible: boolean;
//   onClose: () => void;
//   onWalletImported: (socialData: ISocialProfile[]) => void;
// };

// const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

// type ListShowing = "wallets" | "socials";

// type ConnectWalletBottomSheetState = {
//   thirdwebWalletIdThatIsConnecting: WalletId | undefined;
//   ethereumAddressThatIsConnecting: string | undefined;
//   socialData: ISocialProfile[] | undefined;
//   listShowing: ListShowing | undefined;
// };

// type ConnectWalletBottomSheetActions =
//   | { type: "SetConnectingWallet"; walletId: WalletId }
//   | { type: "ConnectingEthereumAddressDiscovered"; ethereumAddress: string }
//   | { type: "SocialDataLoaded"; data: ISocialProfile[] }
//   | { type: "Reset" };

// function reducer(
//   state: ConnectWalletBottomSheetState,
//   action: ConnectWalletBottomSheetActions,
// ): ConnectWalletBottomSheetState {
//   switch (action.type) {
//     case "SetConnectingWallet":
//       return {
//         ...state,
//         thirdwebWalletIdThatIsConnecting: action.walletId,
//         ethereumAddressThatIsConnecting: undefined,
//         socialData: undefined,
//       };
//     case "ConnectingEthereumAddressDiscovered":
//       return {
//         ...state,
//         ethereumAddressThatIsConnecting: action.ethereumAddress,
//       };
//     case "SocialDataLoaded":
//       return {
//         ...state,
//         socialData: action.data,
//         thirdwebWalletIdThatIsConnecting: undefined,
//       };
//     case "Reset":
//       return {
//         ...state,
//         thirdwebWalletIdThatIsConnecting: undefined,
//         ethereumAddressThatIsConnecting: undefined,
//         socialData: undefined,
//       };
//     default:
//       return state;
//   }
// }

// export function ConnectWalletBottomSheet({
//   isVisible,
//   onClose,
//   onWalletImported,
// }: ConnectWalletBottomSheetProps) {
//   const { theme } = useAppTheme();
//   const insets = useSafeAreaInsets();

//   const { installedWallets, isLoading: areInstalledWalletsLoading } =
//     useInstalledWallets();
//   logger.debug(
//     `[ConnectWalletBottomSheet] Installed wallets: ${JSON.stringify(
//       installedWallets,
//       null,
//       2,
//     )}`,
//   );
//   const { connect } = useConnect();

//   const hasInstalledWallets = installedWallets && installedWallets.length > 0;

//   const bottomSheetRef = useBottomSheetModalRef();
//   const currentSender = useCurrentSender();
//   const isInboxClientInitiated =
//     currentSender &&
//     !!getXmtpClientByEthAddress({
//       ethereumAddress: currentSender.ethereumAddress,
//     });

//   const initialState: ConnectWalletBottomSheetState = {
//     listShowing: "wallets",
//     thirdwebWalletIdThatIsConnecting: undefined,
//     ethereumAddressThatIsConnecting: undefined,
//     socialData: undefined,
//   };
//   const [state, dispatch] = React.useReducer(reducer, initialState);
//   const {
//     thirdwebWalletIdThatIsConnecting,
//     ethereumAddressThatIsConnecting,
//     socialData,
//     listShowing,
//   } = state;

//   const restored =
//     useMultiInboxStore.getState().multiInboxClientRestorationState ===
//     "restored";

//   // useEffect(() => {
//   //   logger.debug(
//   //     `[ConnectWalletBottomSheet] Current sender: ${JSON.stringify(
//   //       currentSender,
//   //       null,
//   //       2
//   //     )}`
//   //   );
//   //   if (!currentSender || !restored) {
//   //     return;
//   //   }

//   //   async function loadSocialData() {
//   //     const shaneWallet = "0xa64af7f78de39a238ecd4fff7d6d410dbace2df0";
//   //     const michaelranbowWallet = "0x5222f538B29267a991B346EF61A2A2c389A9f320";
//   //     const socialProfiles =
//   //       await ensureSocialProfilesQueryData(michaelranbowWallet);
//   //     logger.debug(
//   //       `[ConnectWalletBottomSheet] Social profiles: ${JSON.stringify(
//   //         socialProfiles,
//   //         null,
//   //         2
//   //       )}`
//   //     );
//   //     dispatch({ type: "SocialDataLoaded", data: socialProfiles });
//   //   }
//   //   loadSocialData();
//   // }, [ethereumAddressThatIsConnecting, currentSender, restored]);

//   const isShowingWalletList = listShowing === "wallets";
//   const isWalletListDisabled = thirdwebWalletIdThatIsConnecting !== undefined;

//   const isShowingSocialIdentityList =
//     listShowing === "socials" && socialData !== undefined;
//   const isShowingNoSocialsMessage =
//     listShowing === "socials" && socialData === undefined;

//   const handleConnectWalletTapped = async (
//     walletType: WalletId,
//     options?: any,
//   ) => {
//     if (!isInboxClientInitiated) {
//       throw new Error(
//         `[ConnectWalletBottomSheet] Inbox client not initiated for address ${
//           currentSender!.ethereumAddress
//         } when attempting to connect wallet ${walletType}`,
//       );
//     }

//     dispatch({ type: "SetConnectingWallet", walletId: walletType });

//     logger.debug(
//       `[ConnectWalletBottomSheet] Handling connect wallet tapped for ${walletType}`,
//     );

//     connect(async () => {
//       logger.debug(
//         `[ConnectWalletBottomSheet] Creating wallet of type ${walletType}`,
//       );

//       const w = createWallet(walletType, options);

//       logger.debug(
//         `[ConnectWalletBottomSheet] Connecting wallet to thirdweb client`,
//       );
//       const walletAccount = await w.connect({
//         client: thirdwebClient,
//       });

//       const addressToLink = walletAccount.address;
//       dispatch({
//         type: "ConnectingEthereumAddressDiscovered",
//         ethereumAddress: addressToLink,
//       });

//       const socialProfiles = await ensureSocialProfilesQueryData({
//         ethAddress: addressToLink,
//       });
//       logger.debug(
//         `[ConnectWalletBottomSheet]convos ry is awesome Social profiles: ${JSON.stringify(
//           socialProfiles,
//           null,
//           2,
//         )}`,
//       );
//       dispatch({
//         type: "SocialDataLoaded",
//         data: socialProfiles,
//       });
//       logger.debug(
//         `[ConnectWalletBottomSheet] Got wallet address: ${addressToLink}`,
//       );

//       logger.debug(
//         `[ConnectWalletBottomSheet] Getting inbox client for current sender: ${
//           currentSender!.ethereumAddress
//         }`,
//       );
//       const currentInboxClient = await getXmtpClientByEthAddress({
//         ethereumAddress: currentSender!.ethereumAddress,
//       })!;

//       logger.debug(
//         `[ConnectWalletBottomSheet] Checking if address ${addressToLink} can be messaged`,
//       );
//       const resultsMap = await currentInboxClient.canMessage([addressToLink]);
//       logger.debug(
//         `[ConnectWalletBottomSheet] Results map: ${JSON.stringify(
//           resultsMap,
//           null,
//           2,
//         )}`,
//       );
//       const isOnXmtp = resultsMap[addressToLink];

//       logger.debug(
//         `[ConnectWalletBottomSheet] Is on XMTP? ${isOnXmtp} for address ${addressToLink}`,
//       );

//       if (isOnXmtp) {
//         logger.debug(
//           `[ConnectWalletBottomSheet] Address ${addressToLink} is already on XMTP`,
//         );
//         alert(
//           `You are already on XMTP with address ${addressToLink}. We're going to handle this carefully according to https://xmtp-labs.slack.com/archives/C07NSHXK693/p1739215446331469?thread_ts=1739212558.484059&cid=C07NSHXK693.`,
//         );
//       } else {
//         logger.debug(
//           `[ConnectWalletBottomSheet] Creating signer for address ${addressToLink}`,
//         );
//         const signer: IXmtpSigner = {
//           getAddress: async () => addressToLink,
//           getChainId: () => base.id,
//           getBlockNumber: () => undefined,
//           walletType: () => "EOA",
//           signMessage: async (message: string) => {
//             logger.debug(
//               `[ConnectWalletBottomSheet] Signing message for address ${addressToLink}`,
//             );
//             const signature = await walletAccount.signMessage({ message });
//             return signature;
//           },
//         };

//         logger.debug(
//           `[ConnectWalletBottomSheet] Adding account to inbox client`,
//         );
//         await currentInboxClient.addAccount(signer);

//         alert(
//           `You've sucesfully connected ${addressToLink} to your inbox. You won't see anything in the UI yet, but we're working on that now.`,
//         );

//         const socialData = await ensureSocialProfilesQueryData({
//           ethAddress: addressToLink,
//         });

//         onWalletImported(socialData);
//       }

//       return w;
//     });
//   };

//   function handleSocialIdentityTapped(socialIdentity: ISocialProfile) {
//     alert(`You tapped on ${socialIdentity.name}`);
//   }

//   React.useEffect(() => {
//     if (isVisible) {
//       bottomSheetRef.current?.present();
//     } else {
//       bottomSheetRef.current?.dismiss();
//     }
//   }, [isVisible, bottomSheetRef]);

//   return (
//     <BottomSheetModal
//       ref={bottomSheetRef}
//       snapPoints={["50%"]}
//       onDismiss={onClose}>
//       <BottomSheetHeader title="Imiport an identity" />
//       <BottomSheetContentContainer
//         style={{
//           flex: 1,
//         }}>
//         <VStack
//           style={{
//             paddingHorizontal: theme.spacing.md,
//             rowGap: theme.spacing.xs,
//             paddingBottom: insets.bottom,
//           }}>
//           {isShowingWalletList && (
//             <InstalledWalletsList
//               installedWallets={installedWallets ?? []}
//               onWalletTapped={handleConnectWalletTapped}
//               coinbaseCallbackUrl={coinbaseUrl.toString()}
//               isDisabled={isWalletListDisabled}
//               loadingWalletId={thirdwebWalletIdThatIsConnecting}
//             />
//           )}

//           {isShowingNoSocialsMessage && (
//             <Text>No social identities found for this address.</Text>
//           )}

//           {isShowingSocialIdentityList && (
//             <SocialIdentityList
//               socialData={socialData}
//               onSocialIdentityTapped={handleSocialIdentityTapped}
//             />
//           )}

//           {areInstalledWalletsLoading && <Text>Loading wallets</Text>}

//           {!hasInstalledWallets && (
//             <Text>
//               No wallets found. Please install a wallet and try again.
//             </Text>
//           )}
//         </VStack>
//       </BottomSheetContentContainer>
//     </BottomSheetModal>
//   );
// }
