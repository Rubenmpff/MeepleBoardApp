import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ROUTES } from "@/src/constants/routes";
import { useTranslation } from "react-i18next";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import { EmbeddedScreen } from "@/src/components/ui/ScreenLayout";
import { Segmented } from "@/src/ui/components";
import { colors, space } from "@/src/ui/theme";
import SessionsListScreen from "@/src/features/games/sessions/screens/SessionsListScreen";
import CampaignListScreen from "@/src/features/games/campaigns/screens/CampaignListScreen";

type Area = "sessions" | "campaigns";
// Jogar: sessions (with invitations) and campaigns, the existing screens shown without their own header.
export default function PlayScreen() {
  const { t } = useTranslation("navigation");
  const params = useLocalSearchParams();
  const router = useRouter();
  const [area, setArea] = useState<Area>(params.area === "campaigns" ? "campaigns" : "sessions");
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
    <View style={styles.head}>
      <ScreenHeader mode="root" title={t("tabs.play")} rightIcon="add" rightAccessibilityLabel={t(area === "sessions" ? "newSheet.newSession" : "newSheet.newCampaign")}
        onRightPress={() => router.push((area === "sessions" ? ROUTES.SESSION_CREATE : ROUTES.CAMPAIGN_CREATE) as never)} />
      <Segmented items={[{ key: "sessions", label: t("sessions") }, { key: "campaigns", label: t("campaigns") }]} value={area} onChange={setArea} />
    </View>
    <EmbeddedScreen.Provider value={true}>
      <View style={styles.body}>{area === "sessions" ? <SessionsListScreen /> : <CampaignListScreen />}</View>
    </EmbeddedScreen.Provider>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  head: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: space.sm },
  body: { flex: 1 },
});
