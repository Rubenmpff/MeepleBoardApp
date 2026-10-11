/**
 * Campaigns grouped by status (Ativas, Concluídas, Abandonadas).
 * Inside Jogar the header ＋ creates a campaign; standalone, the screen shows its own button.
 */
import ScreenLayout, { EmbeddedScreen } from "@/src/components/ui/ScreenLayout";
import ScreenState from "@/src/components/ui/ScreenState";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import GameCover from "@/src/components/ui/GameCover";
import { useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, Row, Section } from "@/src/ui/components";
import { colors, space, type } from "@/src/ui/theme";
import { formatRating } from "@/src/ui/format";
import campaignService from "../services/campaignService";
import { Campaign, CampaignStatus } from "../types/Campaign";

const SECTIONS: { status: CampaignStatus; title: string }[] = [
  { status: "Active", title: "list.sections.active" },
  { status: "Completed", title: "list.sections.completed" },
  { status: "Abandoned", title: "list.sections.abandoned" },
];

export default function CampaignListScreen() {
  const router = useRouter();
  const embedded = useContext(EmbeddedScreen);
  const { t, i18n } = useTranslation("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const load = useCallback(async (silent = false) => {
    try {
      setLoadError(false);
      if (!silent) setLoading(true);
      setCampaigns(await campaignService.getMine());
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

  const goCreate = () => router.push("/(app)/games/campaigns/create");
  // The list may report 0 matches for a campaign whose detail has some: show the count only when positive.
  const meta = (c: Campaign) => [t("list.members", { count: c.memberCount }), c.matchCount > 0 ? t("list.matches", { count: c.matchCount }) : null,
    c.averagePersonalRating != null ? `★ ${formatRating(c.averagePersonalRating, i18n.language)}` : null].filter(Boolean).join(" · ");

  return (
    <ScreenLayout title={t("list.title")}>
      <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[colors.primary]} tintColor={colors.primary} />}>
        {!embedded && <PrimaryButton title={t("list.new")} icon={<MaterialIcons name="add" size={20} color={colors.onPrimary} />} onPress={goCreate} />}
        {loadError ? <ScreenState error message={t("list.loadError")} onRetry={() => load()} retryLabel={t("ui.retry")} />
          : campaigns.length === 0 ? <EmptyState title={t("list.emptyTitle")} message={t("list.emptyMessage")}
            action={<PrimaryButton title={t("list.createFirst")} onPress={goCreate} />} />
          : SECTIONS.map(({ status, title }) => {
            const items = campaigns.filter(c => c.status === status);
            if (!items.length) return null;
            return <Section key={status} title={t(title)} note={String(items.length)}>
              <Card>
                {items.map((c, index) => <Row key={c.id} first={index === 0} inset={72} strongTitle title={c.name}
                  lead={<GameCover uri={c.gameImageUrl} size={44} />}
                  subtitle={c.gameName ?? undefined}
                  detail={<Text style={type.caption}>{meta(c)}</Text>}
                  accessibilityLabel={c.name}
                  onPress={() => router.push(`/(app)/games/campaigns/${c.id}` as never)} />)}
              </Card>
            </Section>;
          })}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.xs, paddingBottom: 40, gap: space.xl },
});
