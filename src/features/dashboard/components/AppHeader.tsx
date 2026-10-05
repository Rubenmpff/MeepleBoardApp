import { Image, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { DASHBOARD_THEME as theme } from "../styles/dashboardTheme";

type Props = { username?: string; greeting: string; compact?: boolean };

export default function AppHeader({ username, greeting, compact = false }: Props) {
  const { t } = useTranslation("dashboard");
  return (
    <View style={[styles.container, compact && styles.stacked]}>
      {/* Viewport removes transparent margins from the original square asset.
          The logo itself is unchanged. */}
      <View style={styles.logoViewport} accessible accessibilityLabel="MeepleBoard" accessibilityRole="image">
        <Image source={require("@/assets/MeepleBoardLogo.png")} style={styles.logo} resizeMode="contain" accessible={false} />
      </View>
      <View style={[styles.textContainer, compact && styles.stackedText]}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.name} accessibilityRole="header">{username?.trim() || t("player")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: theme.space.lg },
  stacked: { flexDirection: "column", alignItems: "flex-start", gap: theme.space.sm },
  logoViewport: { width: 120, height: 80, overflow: "hidden" },
  logo: { width: 210, height: 210, position: "absolute", left: -45, top: -64 },
  textContainer: { flex: 1, minWidth: 0, flexShrink: 1 },
  stackedText: { flex: 0, width: "100%" },
  greeting: { ...theme.text.body, color: theme.colors.muted, marginBottom: theme.space.xs },
  name: { ...theme.text.title, color: theme.colors.text, flexShrink: 1 },
});
