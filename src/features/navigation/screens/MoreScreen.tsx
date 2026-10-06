import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import SectionCard from "@/src/components/ui/SectionCard";
import { APP_THEME, UI_COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { ROUTES } from "@/src/constants/routes";
import { logout } from "@/src/features/auth/store/authSlice";
import { usePendingJournal } from "@/src/features/games/matches/hooks/usePendingJournal";

export default function MoreScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation("navigation");
  const { count } = usePendingJournal();
  const groups = [
    { title: t("more.play"), entries: [[t("sessions"), ROUTES.SESSIONS], [t("campaigns"), ROUTES.CAMPAIGNS]] },
    { title: t("more.reviews"), entries: [[t("pendingJournal"), ROUTES.PENDING_JOURNAL], [t("rankings"), ROUTES.RANKINGS]] },
    { title: t("more.account"), entries: [[t("profile"), ROUTES.PROFILE], [t("settings"), ROUTES.SETTINGS]] },
  ];
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader mode="root" appearance="refresh" title={t("tabs.more")} />
      {groups.map(group => <View key={group.title} style={styles.group}>
        <Text style={UI_STYLES.section}>{group.title}</Text>
        <SectionCard>{group.entries.map(([label, route]) => <TouchableOpacity key={route} style={styles.row} accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(route as never)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{label}</Text>
            {route === ROUTES.PROFILE && !!user?.userName && <Text style={UI_STYLES.muted}>{user.userName}</Text>}
            {route === ROUTES.PROFILE && !!user?.email && <Text style={UI_STYLES.muted}>{user.email}</Text>}
          </View>
          {route === ROUTES.PENDING_JOURNAL && count > 0 && <Text style={styles.count}>{count}</Text>}
          <MaterialIcons name="chevron-right" size={22} color={UI_COLORS.textMuted} />
        </TouchableOpacity>)}</SectionCard>
      </View>)}
      <TouchableOpacity style={styles.row} accessibilityRole="button" accessibilityLabel={t("logout")} onPress={() => { dispatch(logout()); router.replace(ROUTES.SIGN_IN); }}>
        <Text style={[styles.label, { color: UI_COLORS.error }]}>{t("logout")}</Text>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_THEME.colors.background },
  content: { padding: 16, paddingBottom: 24, gap: 24, width: "100%", maxWidth: 680, alignSelf: "center" },
  group: { gap: 12 },
  row: { ...UI_STYLES.control, minHeight: 52, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  label: { ...UI_STYLES.body, color: UI_COLORS.text },
  count: { ...UI_STYLES.caption, color: UI_COLORS.primary, fontWeight: "700" },
});
