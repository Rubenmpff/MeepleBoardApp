import { useEffect, useState } from "react";
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
import MatchHistoryScreen from "@/src/features/games/matches/screens/MatchHistoryScreen";

type Area = "sessions" | "campaigns" | "matches";
// The last area chosen, so coming back to Jogar reopens it.
let lastArea: Area = "sessions";
const CREATE: Record<Area, [string, string]> = {
  sessions: [ROUTES.SESSION_CREATE, "newSheet.newSession"],
  campaigns: [ROUTES.CAMPAIGN_CREATE, "newSheet.newCampaign"],
  matches: [ROUTES.REGISTER_MATCH, "newSheet.registerMatch"],
};
// Jogar: sessions (with invitations), campaigns and every match played, the existing screens shown without their own header.
export default function PlayScreen() {
  const { t } = useTranslation("navigation");
  const params = useLocalSearchParams();
  const router = useRouter();
  const requested = params.area === "campaigns" || params.area === "matches" || params.area === "sessions" ? params.area : null;
  const [area, setArea] = useState<Area>(requested ?? lastArea);
  useEffect(() => { lastArea = area; }, [area]);
  // Links such as Início → «Ver todas as partidas» choose the area even when Jogar is already open.
  useEffect(() => { if (requested) setArea(requested); }, [requested]);
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
    <View style={styles.head}>
      <ScreenHeader mode="root" title={t("tabs.play")} rightIcon="add" rightAccessibilityLabel={t(CREATE[area][1])}
        onRightPress={() => router.push(CREATE[area][0] as never)} />
      <Segmented items={[{ key: "sessions", label: t("sessions") }, { key: "campaigns", label: t("campaigns") }, { key: "matches", label: t("matches") }]} value={area} onChange={setArea} />
    </View>
    <EmbeddedScreen.Provider value={true}>
      <View style={styles.body}>{area === "sessions" ? <SessionsListScreen /> : area === "campaigns" ? <CampaignListScreen /> : <MatchHistoryScreen />}</View>
    </EmbeddedScreen.Provider>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  head: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: space.sm },
  body: { flex: 1 },
});
