/**
 * «Experiências da comunidade» on the game page, after «Duração das partidas»: the latest published experiences
 * (rating and/or comment, as each person chose) and «Ver todas». Never the match, other participants or the place.
 */
import { useState } from "react";
import { ActionSheetIOS, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Glyph, Section } from "@/src/ui/components";
import { colors, space, strong, touch, type } from "@/src/ui/theme";
import { ROUTES } from "@/src/constants/routes";
import { useGameExperiences } from "../hooks/useGameExperiences";
import { Experience } from "../types/Experience";
import ExperienceCard from "./ExperienceCard";
import ReportSheet from "./ReportSheet";
import communityService from "@/src/features/friends/services/communityService";
import { invalidateFriendsCache } from "@/src/features/friends/hooks/useFriends";

/** ⋯ on an experience: manage your own; report someone else's comment or block its author. */
export function useExperienceMenu(onReport: (id: string) => void, onBlocked: () => void) {
  const { t } = useTranslation("games");
  const { t: tf } = useTranslation("friends");
  const router = useRouter();
  // Blocking the author: confirmed first; both stop seeing each other's publications. The author is never told.
  const block = (item: Experience) => Alert.alert(tf("community.blockTitle", { name: item.authorName }), tf("community.blockMessage"), [
    { text: t("experiences.cancel"), style: "cancel" },
    { text: tf("community.block"), style: "destructive", onPress: async () => {
      try { await communityService.blockAuthor(item.id); invalidateFriendsCache(); onBlocked(); } catch (err: any) { Alert.alert(tf("community.block"), err?.message); }
    } },
  ]);
  return (item: Experience) => {
    if (item.isMine) {
      if (!item.ownMatchId) return undefined;
      const manage = () => router.push({ pathname: ROUTES.MATCH_PUBLISH, params: { id: item.ownMatchId } } as never);
      return () => Platform.OS === "ios"
        ? ActionSheetIOS.showActionSheetWithOptions({ options: [t("experiences.manage"), t("experiences.cancel")], cancelButtonIndex: 1 }, i => { if (i === 0) manage(); })
        : Alert.alert(t("experiences.manage"), undefined, [{ text: t("experiences.cancel"), style: "cancel" }, { text: t("experiences.manage"), onPress: manage }]);
    }
    const actions = [...(item.canReport ? [{ label: t("experiences.report"), run: () => onReport(item.id) }] : []), { label: tf("community.blockAuthor"), run: () => block(item) }];
    return () => Platform.OS === "ios"
      ? ActionSheetIOS.showActionSheetWithOptions({ options: [...actions.map(a => a.label), t("experiences.cancel")], cancelButtonIndex: actions.length, destructiveButtonIndex: actions.length - 1 },
        i => { if (i < actions.length) actions[i].run(); })
      : Alert.alert(t("experiences.more"), undefined, [{ text: t("experiences.cancel"), style: "cancel" }, ...actions.map(a => ({ text: a.label, onPress: a.run }))]);
  };
}

export default function GameExperiencesSection({ gameId }: { gameId: string }) {
  const { t } = useTranslation("games");
  const router = useRouter();
  const { data, loading, error, reload } = useGameExperiences(gameId, 3);
  const [reporting, setReporting] = useState<string | null>(null);
  const menu = useExperienceMenu(setReporting, () => { void reload(); });
  const total = data?.total ?? 0;
  return <Section title={t("experiences.title")}>
    <View style={styles.wrap}>
      {error && !data ? <TouchableOpacity accessibilityRole="button" onPress={() => { void reload(); }}><Text style={type.caption}>{t("experiences.loadError")}</Text><Text style={styles.link}>{t("experiences.retry")}</Text></TouchableOpacity>
        : !loading && total === 0 ? <View style={styles.quiet}><Glyph name="comment-text-outline" size={18} color={colors.icon} /><Text style={[type.caption, styles.flex]}>{t("experiences.empty")}</Text></View>
        : (data?.items ?? []).map(item => <ExperienceCard key={item.id} item={item} onMore={menu(item)} />)}
      {total > 3 && <TouchableOpacity accessibilityRole="button" onPress={() => router.push({ pathname: ROUTES.GAME_EXPERIENCES, params: { id: gameId } } as never)} style={styles.seeAll}>
        <Text style={styles.link}>{t("experiences.seeAll", { count: total })}</Text><Glyph name="chevron-right" size={20} color={colors.primary} />
      </TouchableOpacity>}
      {total > 0 && <View style={styles.note}><Glyph name="information-outline" size={14} color={colors.muted} /><Text style={[type.micro, styles.flex]}>{t("experiences.note")}</Text></View>}
    </View>
    <ReportSheet experienceId={reporting} onClose={() => setReporting(null)} onReported={() => { setReporting(null); Alert.alert(t("experiences.reportTitle"), t("experiences.reported")); void reload(); }} />
  </Section>;
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  seeAll: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: touch, paddingHorizontal: 2 },
  link: { ...type.body, ...strong, color: colors.primary },
  quiet: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 2 },
  flex: { flex: 1, minWidth: 0 },
});
