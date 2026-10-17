/**
 * Administrators: comments with open reports (and those hidden automatically), with the reasons and counts.
 * «Manter» closes the reports (and shows an automatically hidden comment again), «Ocultar…» asks for a reason the
 * author will see, «Repor» shows a hidden one again. Ratings are never affected.
 */
import { useCallback, useEffect, useState } from "react";
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/ui/ScreenLayout";
import ScreenState from "@/src/ui/ScreenState";
import PrimaryButton from "@/src/ui/PrimaryButton";
import { colors, space, strong, type } from "@/src/ui/theme";
import experienceService from "../services/experienceService";
import { REPORT_REASONS, ReportedExperience, ReportReason } from "../types/Experience";
import ExperienceCard from "../components/ExperienceCard";

export default function ExperienceModerationScreen() {
  const { t } = useTranslation("games");
  const [items, setItems] = useState<ReportedExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setItems(await experienceService.reported()); } catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const act = async (id: string, decision: "keep" | "hide" | "restore", reason?: ReportReason) => {
    try { await experienceService.moderate(id, decision, reason); await load(); } catch (err: any) { Alert.alert(t("moderation.title"), err?.message); }
  };
  const hide = (id: string) => {
    const labels = REPORT_REASONS.map(r => t(`moderation.reasons.${r}`));
    if (Platform.OS === "ios") ActionSheetIOS.showActionSheetWithOptions({ title: t("moderation.hideTitle"), message: t("moderation.hideHint"), options: [...labels, t("experiences.cancel")], cancelButtonIndex: labels.length },
      i => { if (i < labels.length) void act(id, "hide", REPORT_REASONS[i]); });
    else Alert.alert(t("moderation.hideTitle"), t("moderation.hideHint"), [...REPORT_REASONS.slice(0, 2).map(r => ({ text: t(`moderation.reasons.${r}`), onPress: () => { void act(id, "hide", r); } })), { text: t("experiences.cancel"), style: "cancel" as const }]);
  };
  if (loading) return <ScreenLayout title={t("moderation.title")}><ScreenState loading message="" /></ScreenLayout>;
  if (error) return <ScreenLayout title={t("moderation.title")}><ScreenState error message={t("moderation.loadError")} onRetry={load} retryLabel={t("moderation.retry")} /></ScreenLayout>;
  return <ScreenLayout title={t("moderation.title")}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={type.caption}>{items.length ? t("moderation.count", { count: items.length }) : t("moderation.none")}</Text>
      {items.map(item => <View key={item.id} style={styles.item}>
        <ExperienceCard item={{ authorName: item.authorName, rating: item.rating, comment: item.comment, mode: "UNKNOWN", players: 0, month: "", edited: false, isMine: false }} metaText={item.gameName} />
        <View style={styles.reasons}>
          {Object.entries(item.reasons).map(([r, n]) => <Text key={r} style={styles.reason}>{t(`moderation.reasons.${r}`)} · {n}</Text>)}
          {item.hidden && <Text style={styles.reason}>{item.hiddenReason === "AutoReports" ? t("moderation.hiddenUntil") : t("moderation.hidden")}</Text>}
        </View>
        <View style={styles.actions}>
          <View style={styles.flex}><PrimaryButton title={item.hidden ? t("moderation.restore") : t("moderation.keep")} variant="secondary" onPress={() => act(item.id, item.hidden ? "restore" : "keep")} /></View>
          <View style={styles.flex}><PrimaryButton title={item.hidden ? t("moderation.keepHidden") : t("moderation.hide")} onPress={() => hide(item.id)} /></View>
        </View>
      </View>)}
    </ScrollView>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.xs, paddingBottom: 40, gap: space.lg },
  item: { gap: space.sm },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reason: { ...type.micro, ...strong, color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  actions: { flexDirection: "row", gap: space.sm },
  flex: { flex: 1 },
});
