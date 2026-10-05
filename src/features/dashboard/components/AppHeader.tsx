import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";

type Props = {
  username?: string;
};

export default function AppHeader({
  username,
}: Props) {
  const { t } = useTranslation(
    "dashboard"
  );

  const displayName =
    username?.trim() ||
    t("player");

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/MeepleBoardLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.textContainer}>
        <Text style={styles.hi}>
          {t("header.greeting", {
            username: displayName,
          })}
        </Text>

        <Text style={styles.sub}>
          {t(
            "header.welcomeBack"
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  logo: {
    width: 150,
    height: 150,
    marginRight: 8,
  },

  textContainer: {
    flex: 1,
  },

  hi: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },

  sub: {
    fontSize: 12,
    color: COLORS.onBackground,
  },
});