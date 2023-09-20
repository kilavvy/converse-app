import {
  getStateFromPath,
  NavigationContainer,
  StackActions,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useRef } from "react";
import { Platform, useColorScheme } from "react-native";

import { initialURL } from "../../components/StateHandlers/InitialStateHandler";
import config from "../../config";
import { useAppStore } from "../../data/store/appStore";
import { backgroundColor, headerTitleStyle } from "../../utils/colors";
import AccountsNav from "./AccountsNav";
import ConversationListNav from "./ConversationListNav";
import ConversationNav from "./ConversationNav";
import ConverseMatchMakerNav from "./ConverseMatchMakerNav";
import NewConversationNav from "./NewConversationNav";
import ProfileNav from "./ProfileNav";
import ShareProfileNav from "./ShareProfileNav";
import WebviewPreviewNav from "./WebviewPreviewNav";

export type NavigationParamList = {
  Accounts: undefined;
  Chats: undefined;
  Conversation: {
    topic?: string;
    message?: string;
    focus?: boolean;
    mainConversationWithPeer?: string;
  };
  NewConversation: {
    peer?: string;
  };
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  Profile: {
    address: string;
  };
  WebviewPreview: {
    uri: string;
  };
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();
const prefix = Linking.createURL("/");
const linking = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
      Conversation: {
        path: "/conversation",
        parse: {
          topic: decodeURIComponent,
        },
        stringify: {
          topic: encodeURIComponent,
        },
      },
      NewConversation: {
        path: "/newConversation",
        parse: {
          peer: decodeURIComponent,
        },
        stringify: {
          peer: encodeURIComponent,
        },
      },
      ShareProfile: {
        path: "/shareProfile",
      },
      WebviewPreview: {
        path: "/webviewPreview",
        parse: {
          uri: decodeURIComponent,
        },
        stringify: {
          uri: encodeURIComponent,
        },
      },
    },
  },
  getStateFromPath: (path: string, options: any) => {
    // dm method must link to the Conversation Screen as well
    // but prefilling the parameters
    let pathForState = path;
    if (pathForState.startsWith("dm?peer=")) {
      const peer = pathForState.slice(8).trim().toLowerCase();
      pathForState = `conversation?mainConversationWithPeer=${peer}&focus=true`;
    } else if (pathForState.startsWith("dm/")) {
      const peer = pathForState.slice(3).trim().toLowerCase();
      pathForState = `conversation?mainConversationWithPeer=${peer}&focus=true`;
    }
    const state = getStateFromPath(pathForState, options);
    return state;
  },
  getInitialURL: () => {
    return initialURL;
  },
};

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export default function Navigation() {
  const colorScheme = useColorScheme();
  const splashScreenHidden = useAppStore((s) => s.splashScreenHidden);
  const navigationState = useRef<any>(undefined);
  return (
    <NavigationContainer
      linking={splashScreenHidden ? (linking as any) : undefined}
      initialState={{
        index: 1,
        routes: [
          {
            name: "Accounts",
          },
          {
            name: "Chats",
          },
        ],
        type: "stack",
      }}
    >
      <NativeStack.Navigator
        screenListeners={({ navigation }) => ({
          state: (e: any) => {
            // Fix deeplink if already on a screen but changing params
            const oldRoutes = navigationState.current?.state.routes || [];
            const newRoutes = e.data?.state?.routes || [];

            if (oldRoutes.length > 0 && newRoutes.length > 0) {
              const currentRoute = oldRoutes[oldRoutes.length - 1];
              const newRoute = newRoutes[newRoutes.length - 1];
              let shouldReplace = false;
              if (
                currentRoute.key === newRoute.key &&
                currentRoute.name === newRoute.name
              ) {
                // We're talking about the same screen!
                if (
                  newRoute.name === "NewConversation" &&
                  newRoute.params?.peer &&
                  currentRoute.params?.peer !== newRoute.params?.peer
                ) {
                  shouldReplace = true;
                } else if (
                  newRoute.name === "Conversation" &&
                  ((newRoute.params?.mainConversationWithPeer &&
                    newRoute.params?.mainConversationWithPeer !==
                      currentRoute.params?.mainConversationWithPeer) ||
                    (newRoute.params?.topic &&
                      newRoute.params?.topic !== currentRoute.params?.topic))
                ) {
                  shouldReplace = true;
                }
              }
              if (shouldReplace) {
                navigation.dispatch(
                  StackActions.replace(newRoute.name, newRoute.params)
                );
              }
            }
            navigationState.current = e.data;
          },
        })}
      >
        <NativeStack.Group
          screenOptions={{
            headerStyle: {
              backgroundColor: backgroundColor(colorScheme),
            },
            headerTitleStyle: headerTitleStyle(colorScheme),
            headerShadowVisible: Platform.OS !== "android",
          }}
        >
          {AccountsNav()}
          {ConversationListNav()}
          {ConversationNav()}
          {NewConversationNav()}
          {ConverseMatchMakerNav()}
          {ShareProfileNav()}
          {WebviewPreviewNav()}
          {ProfileNav()}
        </NativeStack.Group>
      </NativeStack.Navigator>
    </NavigationContainer>
  );
}
