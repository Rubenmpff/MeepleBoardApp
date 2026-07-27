/**
 * CampaignListScreen.tsx
 * src/features/games/screens/CampaignListScreen.tsx
 */

import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import campaignService from "../services/campaignService";
import { Campaign, getStatusColor, getStatusLabel } from "../types/Campaign";
import { StarRating } from "../components/StarRating";
import { COLORS } from "@/src/constants/colors";

export default function CampaignListScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await campaignService.getMine();
      setCampaigns(data);
    } catch (err) {
      console.error("Erro ao carregar campanhas", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const active    = campaigns.filter(c => c.status === "Active");
  const completed = campaigns.filter(c => c.status === "Completed");
  const abandoned = campaigns.filter(c => c.status === "Abandoned");

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Campanhas</Text>
          <Text style={styles.headerSub}>
            {campaigns.length === 0
              ? "Nenhuma campanha ainda"
              : `${active.length} ativa${active.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push("/(app)/games/campaigns/create")}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Nova</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
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
        {campaigns.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="explore" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sem campanhas ainda</Text>
            <Text style={styles.emptyText}>
              Cria uma campanha para acompanhar{"\n"}as tuas aventuras de jogo!
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/(app)/games/campaigns/create")}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add-circle" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Criar primeira campanha</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CampaignSection
              title="Ativas"
              icon="play-circle-filled"
              color={COLORS.success}
              data={active}
              onPress={(id) => router.push(`/(app)/games/campaigns/${id}` as any)}
            />
            <CampaignSection
              title="Concluídas"
              icon="check-circle"
              color={COLORS.primary}
              data={completed}
              onPress={(id) => router.push(`/(app)/games/campaigns/${id}` as any)}
            />
            <CampaignSection
              title="Abandonadas"
              icon="cancel"
              color={COLORS.inactive}
              data={abandoned}
              onPress={(id) => router.push(`/(app)/games/campaigns/${id}` as any)}
            />
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  const statusColor = getStatusColor(c.status);
  const statusLabel = getStatusLabel(c.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
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
            <Text style={styles.cardName} numberOfLines={1}>{c.name}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          {c.gameName && (
            <Text style={styles.cardGame} numberOfLines={1}>🎲 {c.gameName}</Text>
          )}

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="people" size={12} color={COLORS.textMuted ?? "#90A4AE"} />
              <Text style={styles.metaText}>{c.memberCount}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="sports-esports" size={12} color={COLORS.textMuted ?? "#90A4AE"} />
              <Text style={styles.metaText}>{c.matchCount} partidas</Text>
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
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.onBackground },
  headerSub: { fontSize: 13, color: COLORS.inactive, marginTop: 2 },
  createBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  content: { padding: 16 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  sectionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sectionBadgeText: { fontSize: 12, fontWeight: "700" },

  card: {
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "#f0f0f0",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
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

  cardContent: { flex: 1 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  cardName: { fontSize: 15, fontWeight: "800", color: COLORS.onBackground, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "700" },
  cardGame: { fontSize: 12, color: COLORS.inactive, marginBottom: 6 },

  cardMeta: { flexDirection: "row", gap: 10, alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, color: COLORS.inactive, fontWeight: "600" },
  metaRating: { fontSize: 11, color: "#F9A825", fontWeight: "700" },

  progressBar: {
    height: 3, backgroundColor: "#f0f0f0", borderRadius: 999,
    marginTop: 8, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#F9A825", borderRadius: 999 },

  emptyWrap: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.primary + "10",
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.onBackground },
  emptyText: { fontSize: 14, color: COLORS.inactive, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});