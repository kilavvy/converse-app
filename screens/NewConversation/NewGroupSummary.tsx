import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textInputStyle,
  textSecondaryColor,
} from "@styles/colors";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { List } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button/Button";
import TableView from "../../components/TableView/TableView";
import {
  currentAccount,
  useCurrentAccount,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { usePhotoSelect } from "../../hooks/usePhotoSelect";
import { uploadFile } from "../../utils/attachment";
import { strings } from "../../utils/i18n/strings";
import { navigate } from "../../utils/navigation";
import { getPreferredName, getPreferredAvatar } from "../../utils/profile";
import { createGroup } from "../../utils/xmtpRN/conversations";
import { useIsSplitScreen } from "../Navigation/navHelpers";
import { NewConversationModalParams } from "./NewConversationModal";

const getPlaceholderGroupMembers = (
  members: any[],
  account: string,
  currentAccountSocials: any
) => {
  const currentUser = {
    address: account,
    uri: getPreferredAvatar(currentAccountSocials),
    name: getPreferredName(currentAccountSocials, account),
  };

  const memberDetails = members.map((m) => ({
    address: m.address,
    uri: getPreferredAvatar(
      useProfilesStore((s) => s.profiles[m.address ?? ""]?.socials)
    ),
    name: getPreferredName(m, m.address),
  }));
  return [currentUser, ...memberDetails];
};

export default function NewGroupSummary({
  route,
  navigation,
}: NativeStackScreenProps<NewConversationModalParams, "NewGroupSummary">) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const isSplitScreen = useIsSplitScreen();
  const [groupPermissionLevel, setGroupPermissionLevel] = useState<
    "all_members" | "admin_only"
  >("admin_only");
  const account = useCurrentAccount();
  const currentAccountSocials = useProfilesStore(
    (s) => s.profiles[account ?? ""]?.socials
  );
  const { photo: groupPhoto, addPhoto: addGroupPhoto } = usePhotoSelect();
  const [
    { remotePhotoUrl, isLoading: isUploadingGroupPhoto },
    setRemotePhotUrl,
  ] = useState<{ remotePhotoUrl: string | undefined; isLoading: boolean }>({
    remotePhotoUrl: undefined,
    isLoading: false,
  });
  const defaultGroupName = useMemo(() => {
    if (!account) return "";
    const members = route.params.members.slice(0, 3);
    let groupName = getPreferredName(currentAccountSocials, account);
    if (members.length) {
      groupName += ", ";
    }
    for (let i = 0; i < members.length; i++) {
      groupName += getPreferredName(members[i], members[i].address);
      if (i < members.length - 1) {
        groupName += ", ";
      }
    }

    return groupName;
  }, [route.params.members, account, currentAccountSocials]);
  const colorScheme = useColorScheme();
  const [groupName, setGroupName] = useState(defaultGroupName);
  const [groupDescription, setGroupDescription] = useState("");

  useEffect(() => {
    if (!groupPhoto) return;
    setRemotePhotUrl({ remotePhotoUrl: undefined, isLoading: true });
    uploadFile({
      account: currentAccount(),
      filePath: groupPhoto,
      contentType: "image/jpeg",
    })
      .then((url) => {
        setRemotePhotUrl({
          remotePhotoUrl: url,
          isLoading: false,
        });
      })
      .catch((e) => {
        Alert.alert(strings.upload_group_photo_error, e.message);
        setRemotePhotUrl({
          remotePhotoUrl: undefined,
          isLoading: false,
        });
      });
  }, [groupPhoto, setRemotePhotUrl]);

  const onCreateGroupPress = useCallback(async () => {
    setCreatingGroup(true);
    const groupTopic = await createGroup(
      currentAccount(),
      route.params.members.map((m) => m.address),
      groupPermissionLevel,
      groupName,
      remotePhotoUrl,
      groupDescription
    );
    if (Platform.OS !== "web") {
      navigation.getParent()?.goBack();
    }
    setTimeout(
      () => {
        navigate("Conversation", {
          topic: groupTopic,
          focus: true,
        });
      },
      isSplitScreen ? 0 : 300
    );
  }, [
    groupDescription,
    groupName,
    groupPermissionLevel,
    isSplitScreen,
    navigation,
    remotePhotoUrl,
    route.params.members,
  ]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        creatingGroup || isUploadingGroupPhoto ? (
          <ActivityIndicator style={styles.activitySpinner} />
        ) : (
          <Button variant="text" title="Create" onPress={onCreateGroupPress} />
        ),
    });
  }, [
    creatingGroup,
    isUploadingGroupPhoto,
    navigation,
    onCreateGroupPress,
    styles,
  ]);

  const handleSwitch = useCallback(() => {
    setGroupPermissionLevel((p) =>
      p === "admin_only" ? "all_members" : "admin_only"
    );
  }, []);

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <List.Section>
        <View style={styles.listSectionContainer}>
          <Avatar
            uri={groupPhoto}
            style={styles.avatar}
            color={false}
            name={groupName}
            placeholderGroupMembers={getPlaceholderGroupMembers(
              route.params.members,
              account ?? "",
              currentAccountSocials
            )}
          />
          <Button
            variant="text"
            title={
              groupPhoto ? "Change profile picture" : "Add profile picture"
            }
            textStyle={styles.buttonText}
            onPress={addGroupPhoto}
          />
        </View>
      </List.Section>

      <List.Section>
        <List.Subheader style={styles.sectionTitle}>
          {strings.group_name}
        </List.Subheader>
        <TextInput
          defaultValue={defaultGroupName}
          style={[textInputStyle(colorScheme), styles.nameInput]}
          value={groupName}
          onChangeText={setGroupName}
        />
      </List.Section>
      <List.Section>
        <List.Subheader style={styles.sectionTitle}>
          {strings.group_description}
        </List.Subheader>
        <TextInput
          defaultValue={groupDescription}
          style={[textInputStyle(colorScheme), styles.nameInput]}
          value={groupDescription}
          onChangeText={setGroupDescription}
        />
      </List.Section>
      <TableView
        items={route.params.members.map((a) => ({
          id: a.address,
          title: getPreferredName(a, a.address),
        }))}
        title="MEMBERS"
      />
      <TableView
        items={[
          {
            title: "Add and remove other members",
            id: "groupPermissionLevel",
            rightView: (
              <Switch
                onValueChange={handleSwitch}
                value={groupPermissionLevel === "all_members"}
              />
            ),
          },
        ]}
        title="MEMBERS OF THE GROUP CAN"
      />
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    avatar: {
      marginBottom: 10,
      marginTop: 23,
    },
    group: {
      backgroundColor: backgroundColor(colorScheme),
    },
    groupContent: {
      paddingHorizontal:
        Platform.OS === "ios" || Platform.OS === "web" ? 18 : 0,
    },
    sectionTitle: {
      marginBottom: -8,
      color: textSecondaryColor(colorScheme),
      fontSize: 13,
      fontWeight: "500",
    },
    activitySpinner: {
      marginRight: 5,
    },
    listSectionContainer: {
      alignItems: "center",
    },
    buttonText: {
      fontWeight: "500",
    },
    nameInput: {
      fontSize: 16,
    },
  });
};
