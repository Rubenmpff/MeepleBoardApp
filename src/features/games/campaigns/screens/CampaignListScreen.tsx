/**
 * CampaignListScreen.tsx
 * src/features/games/screens/CampaignListScreen.tsx
 */
import { CAMPAIGN_STATUS_COLORS } from "@/src/styles/statusColors";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import campaignService from "../services/campaignService";
import { Campaign, getCampaignStatusKey, getStatusColor } from "../types/Campaign";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
export default function CampaignListScreen() {
  const router = useRouter();
  const { t } = useTranslation("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const load = useCallback(async (silent = false) => {
    try {
      setLoadError(false);
      if (!silent) setLoading(true);
      const data = await campaignService.getMine();
      setCampaigns(data);
    } catch (err) {
      setLoadError(true);
      console.error(t("list.loadError"), err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <ScreenLayout title={t("list.title")}><ScreenState loading message={t("ui.loading")} /></ScreenLayout>;
  const active    = campaigns.filter(c => c.status === "Active");
  const completed = campaigns.filter(c => c.status === "Completed");
  const abandoned = campaigns.filter(c => c.status === "Abandoned");
  return (
    <ScreenLayout title={t("list.title")}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>
            {campaigns.length === 0
              ? t("list.none")
              : t("list.activeCount", { count: active.length })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push("/(app)/games/campaigns/create")}
          activeOpacity={0.85} accessibilityRole="button"
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>{t("list.new")}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loadError ? <ScreenState error message={t("list.loadError")} onRetry={() => load()} retryLabel={t("ui.retry")} /> : campaigns.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="explore" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t("list.emptyTitle")}</Text>
            <Text style={styles.emptyText}>
              {t("list.emptyMessage")}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/(app)/games/campaigns/create")}
              activeOpacity={0.85} accessibilityRole="button"
            >
              <MaterialIcons name="add-circle" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>{t("list.createFirst")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CampaignSection
              title={t("list.sections.active")}
              icon="play-circle-filled"
              color={COLORS.success}
              data={active}
              onPress={(id) => router.push(`/(app)/games/campaigns/${id}` as any)}
            />
            <CampaignSection
              title={t("list.sections.completed")}
              icon="check-circle"
              color={COLORS.primary}
              data={completed}
              onPress={(id) => router.push(`/(app)/games/campaigns/${id}` as any)}
            />
            <CampaignSection
              title={t("list.sections.abandoned")}
              icon="cancel"
              color={COLORS.inactive}
              data={abandoned}
              onPress={(id) => router.push(`/(app)/games/campaigns/${id}` as any)}
            />
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
}
function CampaignSection({ title, icon, color, data, onPress }: {
  title: string;
  icon: string;
  color: string;
  data: Campaign[];
  onPress: (id: string) => void;
}) {
  if (data.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon as any} size={16} color={color} />
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        <View style={[styles.sectionBadge, { backgroundColor: color + "20" }]}>
          <Text style={[styles.sectionBadgeText, { color }]}>{data.length}</Text>
        </View>
      </View>
      {data.map(c => (
        <CampaignCard key={c.id} campaign={c} onPress={() => onPress(c.id)} />
      ))}
    </View>
  );
}
function CampaignCard({ campaign: c, onPress }: { campaign: Campaign; onPress: () => void }) {
  const statusColor = CAMPAIGN_STATUS_COLORS[c.status];
  const { t } = useTranslation("campaigns");
  const statusLabel = t(getCampaignStatusKey(c.status));
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={c.name}>
      <View style={styles.cardInner}>
        {/* Imagem do jogo */}
        <View style={styles.cardImageWrap}>
          {c.gameImageUrl ? (
            <Image source={{ uri: c.gameImageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <MaterialIcons name="sports-esports" size={24} color={COLORS.primary} />
            </View>
          )}
          {/* Badge de status sobre a imagem */}
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        {/* Conteúdo */}
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={styles.cardName}>{c.name}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          {c.gameName && (
            <Text style={styles.cardGame} numberOfLines={1}>🎲 {c.gameName}</Text>
          )}
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="people" size={12} color={COLORS.textMuted ?? COLORS.textMuted} />
              <Text style={styles.metaText}>{c.memberCount}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="sports-esports" size={12} color={COLORS.textMuted ?? COLORS.textMuted} />
              <Text style={styles.metaText}>{t("list.matches", { count: c.matchCount })}</Text>
            </View>
            {c.averagePersonalRating != null && (
              <View style={styles.metaItem}>
                <Text style={styles.metaRating}>⭐ {c.averagePersonalRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          {/* Mini barra de progresso se tiver rating */}
          {c.averagePersonalRating != null && (
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${(c.averagePersonalRating / 10) * 100}%` }
              ]} />
            </View>
          )}
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#ddd" />
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  headerSub: { ...UI_STYLES.caption, color: COLORS.textMuted, marginTop: 4 },
  createBtn: { ...UI_STYLES.button, flexDirection: "row", gap: 8, backgroundColor: COLORS.primary },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { ...UI_STYLES.section, flexShrink: 1 },
  sectionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sectionBadgeText: { ...UI_STYLES.caption, fontWeight: "700" },
  card: { ...UI_STYLES.card, marginBottom: 16 },
  cardInner: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  cardImageWrap: { position: "relative" },
  cardImage: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  cardImagePlaceholder: { justifyContent: "center", alignItems: "center" },
  statusDot: {
    position: "absolute", bottom: -2, right: -2,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: "#fff",
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardTop: { gap: 8, marginBottom: 8 },
  cardName: { ...UI_STYLES.section },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { ...UI_STYLES.caption, fontWeight: "700" },
  cardGame: { ...UI_STYLES.body, color: COLORS.textMuted, marginBottom: 8 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { ...UI_STYLES.caption, color: COLORS.textMuted },
  metaRating: { ...UI_STYLES.caption, color: COLORS.secondary, fontWeight: "700" },
  progressBar: {
    height: 3, backgroundColor: "#f0f0f0", borderRadius: 999,
    marginTop: 8, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: COLORS.secondary, borderRadius: 999 },
  emptyWrap: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: {
    width: 80, minHeight: 80, borderRadius: 24,
    backgroundColor: COLORS.primary + "10",
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { ...UI_STYLES.section, textAlign: "center" },
  emptyText: { ...UI_STYLES.empty },
  emptyBtn: { ...UI_STYLES.button, flexDirection: "row", gap: 8, marginTop: 12, backgroundColor: COLORS.primary },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
