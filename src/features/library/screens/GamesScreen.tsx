import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "@/src/ui/ScreenHeader";
import { EmbeddedScreen } from "@/src/ui/ScreenLayout";
import { Segmented } from "@/src/ui/components";
import { colors, space } from "@/src/ui/theme";
import MyLibraryScreen from "./MyLibraryScreen";
import GameSearchScreen from "@/src/features/games/catalog/screens/GameSearchScreen";
import { recall, useAccountId, useRemember } from "@/src/shared/hooks/useAccountMemory";

type Area = "library" | "discover";
// Jogos: my library (what I have, want and played) and discovering games in the catalogue, including Rankings.
export default function GamesScreen() {
  const { t } = useTranslation("library");
  const params = useLocalSearchParams();
  const requested = params.area === "discover" ? "discover" : params.area === "library" ? "library" : undefined;
  // Kept per account while the app is open; each area keeps its own search, filters and position.
  const account = useAccountId();
  const [area, setArea] = useState<Area>(() => requested ?? recall(account, "games:area", "library"));
  useRemember("games:area", area);
  useEffect(() => { if (requested) setArea(requested); }, [requested]);
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
    <View style={styles.head}>
      <ScreenHeader mode="root" title={t("hub.title")} rightIcon="plus" rightAccessibilityLabel={t("ui.add")} onRightPress={() => setArea("discover")} />
      <Segmented items={[{ key: "library", label: t("hub.library") }, { key: "discover", label: t("hub.discover") }]} value={area} onChange={setArea} />
    </View>
    <EmbeddedScreen.Provider value={true}>
      <View style={styles.body}>{area === "library" ? <MyLibraryScreen /> : <GameSearchScreen />}</View>
    </EmbeddedScreen.Provider>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  head: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: space.sm },
  body: { flex: 1 },
});
