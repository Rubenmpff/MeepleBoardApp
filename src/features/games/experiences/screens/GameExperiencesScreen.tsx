/** All published experiences of a game, newest first; your own can be managed, others' comments reported. */
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/ui/ScreenLayout";
import ScreenState from "@/src/ui/ScreenState";
import { colors, space, type } from "@/src/ui/theme";
import experienceService from "../services/experienceService";
import { Experience } from "../types/Experience";
import ExperienceCard from "../components/ExperienceCard";
import ReportSheet from "../components/ReportSheet";
import { useExperienceMenu } from "../components/GameExperiencesSection";

const PAGE = 20;

export default function GameExperiencesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("games");
  const [items, setItems] = useState<Experience[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);
  const menu = useExperienceMenu(setReporting);
  const load = useCallback(async (offset = 0) => {
    if (!id) return;
    if (offset === 0) setLoading(true);
    setError(false);
    try { const page = await experienceService.listForGame(id, offset, PAGE); setItems(prev => offset ? [...prev, ...page.items] : page.items); setTotal(page.total); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <ScreenLayout title={t("experiences.listTitle")}><ScreenState loading message="" /></ScreenLayout>;
  if (error && !items.length) return <ScreenLayout title={t("experiences.listTitle")}><ScreenState error message={t("experiences.loadError")} onRetry={() => load()} retryLabel={t("experiences.retry")} /></ScreenLayout>;
  return <ScreenLayout title={t("experiences.listTitle")}>
    <FlatList data={items} keyExtractor={i => i.id} contentContainerStyle={styles.content}
      ListHeaderComponent={<Text style={type.caption}>{t("experiences.listCount", { count: total })}</Text>}
      ListEmptyComponent={<Text style={type.caption}>{t("experiences.empty")}</Text>}
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      renderItem={({ item }) => <ExperienceCard item={item} onMore={menu(item)} />}
      onEndReached={() => { if (items.length < total) void load(items.length); }}
      ListFooterComponent={items.length < total ? <ActivityIndicator color={colors.primary} /> : null} />
    <ReportSheet experienceId={reporting} onClose={() => setReporting(null)} onReported={() => { setReporting(null); Alert.alert(t("experiences.reportTitle"), t("experiences.reported")); void load(); }} />
  </ScreenLayout>;
}

const styles = StyleSheet.create({ content: { padding: space.lg, paddingTop: space.xs, paddingBottom: 40, gap: space.md } });
