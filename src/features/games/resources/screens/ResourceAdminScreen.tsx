/**
 * Resource administration (administrators only; the API enforces the role):
 * review suggestions, edit, hide or remove links, and resolve problem reports.
 * Route: /games/resources/admin[?gameId&gameName] — with a game, only that game's resources.
 */
import { useCallback, useState } from "react";
import { Alert, Linking, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import ScreenScroll from "@/src/ui/Screen";
import Sheet from "@/src/ui/Sheet";
import { Button, Card, EmptyState, Note, Row, Segmented } from "@/src/ui/components";
import { colors, radius, space, strong, type } from "@/src/ui/theme";
import { formatDate } from "@/src/ui/format";
import { ROUTES } from "@/src/constants/routes";
import { languageName, sourceLine } from "../components/ResourceRow";
import resourceService from "../services/resourceService";
import { apiMessage } from "../utils/apiMessage";
import { GameResourceAdmin, GameResourceReport, ResourceStatus } from "../types/GameResource";

type Tab = ResourceStatus | "Reports";
const TABS: Tab[] = ["Pending", "Approved", "Rejected", "Reports"];

export default function ResourceAdminScreen() {
  const { t, i18n } = useTranslation("games");
  const router = useRouter();
  const { gameId, gameName } = useLocalSearchParams<{ gameId?: string; gameName?: string }>();
  const [tab, setTab] = useState<Tab>("Pending");
  const [items, setItems] = useState<GameResourceAdmin[]>([]);
  const [reports, setReports] = useState<GameResourceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<GameResourceAdmin | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setError(false);
    try {
      const [all, open] = await Promise.all([resourceService.review(undefined, gameId), resourceService.reports()]);
      setItems(all); setReports(gameId ? open.filter(r => r.gameId === gameId) : open);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [gameId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function act(id: string, action: () => Promise<unknown>) {
    setBusy(id);
    try { await action(); await load(); }
    catch (e) { Alert.alert(t("resources.admin.error"), apiMessage(e) ?? ""); }
    finally { setBusy(null); }
  }
  const remove = (item: GameResourceAdmin) => Alert.alert(t("resources.admin.remove"), t("resources.admin.removeConfirm", { title: item.resource.title }), [
    { text: t("resources.cancel"), style: "cancel" },
    { text: t("resources.admin.remove"), style: "destructive", onPress: () => { void act(item.resource.id, () => resourceService.remove(item.resource.id)); } },
  ]);
  const edit = (item: GameResourceAdmin) => router.push({ pathname: ROUTES.RESOURCE_FORM, params: { gameId: item.resource.gameId, gameName: item.gameName, resourceId: item.resource.id } } as never);

  const shown = items.filter(i => i.resource.status === tab);
  const count = (key: Tab) => key === "Reports" ? reports.length : items.filter(i => i.resource.status === key).length;

  const card = (item: GameResourceAdmin) => {
    const r = item.resource;
    const kind = r.kind === "PrintModel" && r.printCategory ? `${t("resources.kinds.PrintModel")} · ${t(`resources.categories.${r.printCategory}`)}` : t(`resources.kinds.${r.kind}`);
    const facts = [kind, languageName(t, r.language), r.isOfficial ? t("resources.official") : null, r.isFree == null ? null : t(r.isFree ? "resources.free" : "resources.paid")].filter(Boolean).join(" · ");
    const disabled = busy === r.id;
    return <Card key={r.id} padded style={styles.card}>
      <Text style={[type.body, strong]}>{r.title}</Text>
      <Text style={type.caption}>{sourceLine(r.author, r.platform)}</Text>
      <Text style={type.caption}>{facts}</Text>
      {!gameId && <Text style={type.caption}>{item.gameName}</Text>}
      {!!r.compatibility && <Text style={type.caption}>{t("resources.fits", { value: r.compatibility })}</Text>}
      <Text style={[type.caption, styles.url]} numberOfLines={2}>{r.url}</Text>
      <Text style={type.caption}>{item.suggestedBy ? t("resources.admin.suggestedBy", { name: item.suggestedBy, date: formatDate(item.createdAt, i18n.language) }) : t("resources.admin.addedOn", { date: formatDate(item.createdAt, i18n.language) })}</Text>
      {!!item.reviewNote && <Text style={type.caption}>{t("resources.admin.note", { note: item.reviewNote })}</Text>}
      {item.openReports > 0 && <Text style={[type.caption, styles.warning]}>{t("resources.admin.openReports", { count: item.openReports })}</Text>}
      <View style={styles.actions}>
        {r.status !== "Approved" && <Button variant="primary" title={t("resources.admin.approve")} disabled={disabled} onPress={() => { void act(r.id, () => resourceService.approve(r.id)); }} />}
        {r.status !== "Rejected" && <Button title={t(r.status === "Approved" ? "resources.admin.hide" : "resources.admin.reject")} disabled={disabled} onPress={() => { setNote(""); setRejecting(item); }} />}
        <Button title={t("resources.admin.edit")} disabled={disabled} onPress={() => edit(item)} />
        <Button variant="plain" title={t("resources.admin.openLink")} onPress={() => { void Linking.openURL(r.url); }} />
      </View>
      <Row first title={t("resources.admin.remove")} tone="danger" end="none" onPress={() => remove(item)} />
    </Card>;
  };

  return <ScreenLayout title={t("resources.admin.title")}>
    <ScreenScroll refreshControl={<RefreshControl refreshing={false} onRefresh={() => { void load(); }} tintColor={colors.primary} />}>
      {!!gameName && <Note inset>{gameName}</Note>}
      <Segmented items={TABS.map(key => ({ key, label: t(`resources.admin.tabs.${key}`), count: String(count(key)) }))} value={tab} onChange={setTab} />
      {!!gameId && <Button icon="plus" title={t("resources.admin.add")} onPress={() => router.push({ pathname: ROUTES.RESOURCE_FORM, params: { gameId, gameName, admin: "1" } } as never)} />}
      {loading ? <ScreenState loading message={t("resources.loading")} />
        : error ? <ScreenState error message={t("resources.loadError")} onRetry={() => { void load(); }} retryLabel={t("ui.retry")} />
        : tab === "Reports" ? (reports.length === 0 ? <EmptyState title={t("resources.admin.empty.Reports")} message={t("resources.admin.emptyHint")} />
          : reports.map(report => <Card key={report.id} padded style={styles.card}>
            <Text style={[type.body, strong]}>{report.resourceTitle}</Text>
            {!gameId && <Text style={type.caption}>{report.gameName}</Text>}
            <Text style={type.caption}>{t("resources.admin.reportedBy", { name: report.reportedBy, reason: t(`resources.reasons.${report.reason}`), date: formatDate(report.createdAt, i18n.language) })}</Text>
            {!!report.comment && <Text style={type.body}>{report.comment}</Text>}
            <View style={styles.actions}>
              <Button variant="primary" title={t("resources.admin.resolve")} disabled={busy === report.id} onPress={() => { void act(report.id, () => resourceService.resolveReport(report.id)); }} />
              <Button variant="plain" title={t("resources.admin.openLink")} onPress={() => { void Linking.openURL(report.url); }} />
            </View>
          </Card>))
        : shown.length === 0 ? <EmptyState title={t(`resources.admin.empty.${tab}`)} message={t("resources.admin.emptyHint")} />
        : shown.map(card)}
    </ScreenScroll>

    <Sheet visible={!!rejecting} title={t(rejecting?.resource.status === "Approved" ? "resources.admin.hide" : "resources.admin.reject")} onClose={() => setRejecting(null)} closeLabel={t("resources.close")}
      left={{ label: t("resources.cancel"), onPress: () => setRejecting(null) }}
      right={{ label: t("resources.admin.confirm"), bold: true, onPress: () => { const item = rejecting!; setRejecting(null); void act(item.resource.id, () => resourceService.reject(item.resource.id, note.trim() || null)); } }}>
      {!!rejecting && <Note inset>{rejecting.resource.title}</Note>}
      <Text style={[type.body, styles.pad]}>{t("resources.admin.rejectNote")}</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} multiline maxLength={300} accessibilityLabel={t("resources.admin.rejectNote")} placeholderTextColor={colors.placeholder} />
      <Note inset>{t("resources.admin.rejectHint")}</Note>
    </Sheet>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  card: { gap: space.xs },
  url: { color: colors.primary },
  warning: { color: colors.pendingText },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  pad: { paddingHorizontal: space.lg },
  input: { minHeight: 88, borderRadius: radius.control, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: space.md, fontSize: 15, color: colors.text, textAlignVertical: "top" },
});
