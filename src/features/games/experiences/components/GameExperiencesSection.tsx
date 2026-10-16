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

/** ⋯ on an experience: manage your own; report someone else's comment. */
export function useExperienceMenu(onReport: (id: string) => void) {
  const { t } = useTranslation("games");
  const router = useRouter();
  return (item: Experience) => {
    const action = item.isMine && item.ownMatchId ? t("experiences.manage") : item.canReport ? t("experiences.report") : null;
    if (!action) return undefined;
    const run = () => item.isMine && item.ownMatchId ? router.push({ pathname: ROUTES.MATCH_PUBLISH, params: { id: item.ownMatchId } } as never) : onReport(item.id);
    return () => Platform.OS === "ios"
      ? ActionSheetIOS.showActionSheetWithOptions({ options: [action, t("experiences.cancel")], cancelButtonIndex: 1, destructiveButtonIndex: item.isMine ? undefined : 0 }, i => { if (i === 0) run(); })
      : Alert.alert(action, undefined, [{ text: t("experiences.cancel"), style: "cancel" }, { text: action, onPress: run }]);
  };
}

export default function GameExperiencesSection({ gameId }: { gameId: string }) {
  const { t } = useTranslation("games");
  const router = useRouter();
  const { data, loading, error, reload } = useGameExperiences(gameId, 3);
  const [reporting, setReporting] = useState<string | null>(null);
  const menu = useExperienceMenu(setReporting);
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
