/**
 * «A tua experiência» on the game page: your matches, your rating and your campaigns together.
 * Your rating stays the average of the ratings you gave your matches in their journals (never a rating
 * of the game itself), with a way into the journal. Nothing here changes how anything is calculated.
 */
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import ScreenState from "@/src/ui/ScreenState";
import { Card, Glyph, Row, Section } from "@/src/ui/components";
import { colors, isLarge, space, strong, touch, type } from "@/src/ui/theme";
import { formatDate, formatRating } from "@/src/ui/format";
import { matchResultText } from "../../sessions/utils/matchResultKey";
import { MatchDto } from "../../matches/types/MatchForm";
import { Campaign } from "../../campaigns/types/Campaign";

export type JournalTarget = { id: string; date: string; pending: boolean };
const PREVIEW = 2;
const CAMPAIGNS = 3;

type Props = {
  gameName: string;
  language: string;
  userId?: string;
  matches: MatchDto[];
  historyLoading: boolean;
  historyError: boolean;
  onRetryHistory: () => void;
  userRating: number | null;
  allMatches: boolean;
  onToggleMatches: () => void;
  campaigns: Campaign[];
  campaignsLoading: boolean;
  campaignsError: boolean;
  onRetryCampaigns: () => void;
  allCampaigns: boolean;
  onToggleCampaigns: () => void;
  onOpenMatch: (id: string) => void;
  onOpenJournal: (id: string) => void;
  onOpenCampaign: (id: string) => void;
  onNewCampaign: () => void;
  /** Companhia for this game since your first match; absent without matches. */
  company?: { limited: boolean; onOpen: () => void };
};

/** The match to rate next (most recent with an open journal and no rating), or the latest to review. */
export function journalTarget(matches: MatchDto[]): JournalTarget | null {
  const toRate = matches.find(m => m.id && m.personalRating == null && m.journalStatus !== "Closed");
  const latest = matches.find(m => m.id);
  return toRate ? { id: toRate.id!, date: toRate.matchDate, pending: true } : latest ? { id: latest.id!, date: latest.matchDate, pending: false } : null;
}

/** Your outcome in a match: a win, your place when known, or nothing. */
export function myResult(match: MatchDto, userId?: string): { win: boolean; place?: number } {
  const me = match.players?.find(p => p.userId === userId);
  const win = !!me && (me.outcome ? me.outcome === "Win" : me.isWinner) || (!me && !!userId && match.winnerId === userId);
  return { win, place: me?.rankPosition && me.rankPosition > 0 ? me.rankPosition : undefined };
}

export default function GameExperience(p: Props) {
  const { t } = useTranslation("games");
  const { width, fontScale } = useWindowDimensions();
  const large = isLarge(width, fontScale);
  const tm = (key: string, options?: Record<string, unknown>) => t(`matches:${key}`, options);
  const { matches, language } = p;
  const journal = journalTarget(matches);
  const rated = matches.filter(m => m.personalRating != null).length;
  const pending = matches.filter(m => m.id && m.personalRating == null && m.journalStatus !== "Closed").length;
  const wins = matches.filter(m => myResult(m, p.userId).win).length;
  const shown = p.allMatches ? matches : matches.slice(0, PREVIEW);
  const campaigns = p.allCampaigns ? p.campaigns : p.campaigns.slice(0, CAMPAIGNS);

  const campaignRows = <>
    {p.campaignsLoading || p.campaignsError ? <ScreenState loading={p.campaignsLoading} error={p.campaignsError} message={t(p.campaignsLoading ? "ui.loadingCampaigns" : "ui.loadError")}
      onRetry={p.campaignsError ? p.onRetryCampaigns : undefined} retryLabel={t("ui.retry")} />
      : campaigns.map(c => <Row key={c.id} inset={52} lead={<Glyph name="flag-checkered" size={20} color={colors.friend} />} strongTitle title={c.name} accessibilityLabel={c.name}
        subtitle={[c.status === "Active" ? t("details.campaignStatus.active") : c.status === "Completed" ? t("details.campaignStatus.completed") : t("details.campaignStatus.abandoned"),
          t("details.members", { count: c.memberCount }), t("details.matches", { count: c.matchCount }),
          c.averagePersonalRating ? `★ ${formatRating(c.averagePersonalRating, language)}` : null].filter(Boolean).join(" · ")}
        detail={c.notes ? <Text style={type.caption} numberOfLines={2}>{c.notes}</Text> : undefined}
        onPress={() => p.onOpenCampaign(c.id)} />)}
    {p.campaigns.length > CAMPAIGNS && <Row title={t(p.allCampaigns ? "details.showFewer" : "details.showAllCampaigns", { count: p.campaigns.length })} tone="link"
      end={p.allCampaigns ? "collapse" : "expand"} onPress={p.onToggleCampaigns} />}
    <Row inset={52} lead={<Glyph name="plus" size={20} color={colors.primary} />} title={t("details.newCampaign")} tone="link" end="none" onPress={p.onNewCampaign} />
  </>;

  if (p.historyLoading || p.historyError) return <Section title={t("details.experience.title")}>
    <Card><ScreenState loading={p.historyLoading} error={p.historyError} message={t(p.historyLoading ? "ui.loadingHistory" : "ui.loadError")}
      onRetry={p.historyError ? p.onRetryHistory : undefined} retryLabel={t("ui.retry")} /></Card>
  </Section>;

  if (!matches.length) return <Section title={t("details.experience.title")}>
    <View style={styles.quiet}>
      <Glyph name="notebook-outline" size={18} color={colors.icon} />
      <Text style={[type.caption, styles.flex]}>{t("details.experience.empty")}</Text>
    </View>
    {(p.campaignsLoading || p.campaignsError || p.campaigns.length > 0) ? <Card>{campaignRows}</Card>
      : <TouchableOpacity style={styles.newCampaign} onPress={p.onNewCampaign} accessibilityRole="button" accessibilityLabel={t("details.newCampaign")}>
        <Glyph name="plus" size={18} color={colors.primary} />
        <Text style={[type.body, strong, { color: colors.primary }]}>{t("details.newCampaign")}</Text>
      </TouchableOpacity>}
  </Section>;

  const last = matches[0]?.matchDate;
  const stats = [
    { value: String(matches.length), label: t("details.experience.matches", { count: matches.length }) },
    { value: String(wins), label: t("details.experience.wins", { count: wins }) },
    // The year only when it is not this year's.
    { value: last ? (new Date(last).getFullYear() === new Date().getFullYear() ? formatDate(last, language).replace(/\s\d{4}$/, "") : formatDate(last, language)) : "", label: t("details.experience.last") },
  ];
  return <Section title={t("details.experience.title")}>
    <Card>
      <View style={[styles.stats, large && styles.statsLarge]}>
        {stats.map((s, i) => <View key={s.label} style={[styles.stat, !large && i > 0 && styles.statDivider]} accessible accessibilityLabel={`${s.label}: ${s.value}`}>
          <Text style={styles.statValue}>{s.value}</Text>
          <Text style={[type.micro, styles.center]}>{s.label}</Text>
        </View>)}
      </View>

      <View style={[styles.mine, large && styles.mineLarge]}>
        <View style={styles.flex} accessible accessibilityLabel={p.userRating != null
          ? `${t("details.ratings.personal")}: ${t("details.ratings.outOf", { value: formatRating(p.userRating, language) })}. ${t("details.ratings.personalHint", { count: rated })}`
          : t("details.ratings.personalNone")}>
          <Text style={styles.overline}>{t("details.experience.rating")}</Text>
          {p.userRating != null ? <>
            <Text style={styles.big}>{formatRating(p.userRating, language)}<Text style={styles.scale}> /10</Text></Text>
            <Text style={type.caption}>{t("details.ratings.personalHint", { count: rated })}</Text>
          </> : <Text style={[type.caption, styles.top]}>{t("details.ratings.personalNone")}</Text>}
        </View>
        {journal && <TouchableOpacity style={styles.pill} onPress={() => p.onOpenJournal(journal.id)} accessibilityRole="button"
          accessibilityLabel={t(journal.pending ? "details.ratings.rateMatch" : "details.ratings.reviewJournal", { date: formatDate(journal.date, language) })}>
          <Glyph name="notebook-outline" size={16} color={colors.primary} />
          <Text style={[type.caption, strong, { color: colors.primary }]}>{t("details.experience.journal")}</Text>
        </TouchableOpacity>}
      </View>

      {pending > 0 && journal?.pending && <TouchableOpacity style={styles.pending} onPress={() => p.onOpenJournal(journal.id)} accessibilityRole="button"
        accessibilityLabel={`${t("details.experience.toRate", { count: pending })}. ${t("details.ratings.rateMatch", { date: formatDate(journal.date, language) })}`}>
        <Glyph name="star-outline" size={18} color={colors.gold} />
        <Text style={[type.body, strong, styles.flex, { color: colors.pendingText }]}>{t("details.experience.toRate", { count: pending })}</Text>
        <Text style={[type.body, strong, { color: colors.pendingText }]}>{t("details.experience.rate")} ›</Text>
      </TouchableOpacity>}

      {shown.map(m => {
        const mine = myResult(m, p.userId);
        const result = matchResultText(m, tm);
        const extra = [m.players?.length ? t("details.experience.players", { count: m.players.length }) : null, m.durationInMinutes ? t("details.minutesShort", { count: m.durationInMinutes }) : null,
          m.location || null, m.personalRating != null ? `★ ${formatRating(m.personalRating, language)}` : null].filter(Boolean).join(" · ");
        return <Row key={m.id} inset={52} title={formatDate(m.matchDate, language)} accessibilityLabel={`${formatDate(m.matchDate, language)}. ${result}`}
          lead={<View style={[styles.badge, mine.win ? styles.badgeWin : styles.badgeOther]}>
            {mine.place ? <Text style={[styles.badgeText, { color: mine.win ? colors.primary : colors.muted }]}>{t("details.experience.place", { place: mine.place })}</Text>
              : <Glyph name={mine.win ? "trophy-outline" : "dice-5"} size={16} color={mine.win ? colors.primary : colors.icon} />}
          </View>}
          detail={<>
            <Text style={type.caption}>{result}</Text>
            {!!extra && <Text style={type.caption}>{extra}</Text>}
            {p.allMatches && !!m.personalNotes && <Text style={type.body} numberOfLines={3}>{m.personalNotes}</Text>}
            {p.allMatches && !!m.tags && <Text style={type.caption}>{m.tags.split(",").map(tag => `#${tag.trim()}`).join("  ")}</Text>}
          </>}
          onPress={m.id ? () => p.onOpenMatch(m.id) : undefined} />;
      })}
      {matches.length > PREVIEW && <Row title={t(p.allMatches ? "details.showFewer" : "details.showAllMatches", { count: matches.length })} tone="link"
        end={p.allMatches ? "collapse" : "expand"} onPress={p.onToggleMatches} />}
      {p.company && <Row inset={52} lead={<Glyph name="account-multiple-outline" size={20} color={colors.friend} />} title={t("details.experience.company")} strongTitle
        subtitle={t(p.company.limited ? "details.experience.companyLimited" : "details.experience.companyHint", { name: p.gameName })} onPress={p.company.onOpen} />}
      {campaignRows}
    </Card>
  </Section>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  top: { marginTop: 2 },
  quiet: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: space.lg },
  newCampaign: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch, paddingHorizontal: space.lg, alignSelf: "flex-start" },
  stats: { flexDirection: "row" },
  statsLarge: { flexDirection: "column" },
  stat: { flex: 1, minWidth: 0, alignItems: "center", paddingVertical: space.md, paddingHorizontal: space.sm },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.hair },
  statValue: { fontSize: 20, lineHeight: 24, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"], textAlign: "center" },
  mine: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: colors.hair },
  mineLarge: { flexDirection: "column", alignItems: "flex-start" },
  overline: { ...type.micro, ...strong, letterSpacing: 0.3, textTransform: "uppercase" },
  big: { fontSize: 24, lineHeight: 29, fontWeight: "700", color: colors.text, fontVariant: ["tabular-nums"] },
  scale: { fontSize: 13, fontWeight: "400", color: colors.muted },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: touch, paddingHorizontal: space.md, borderRadius: touch / 2, backgroundColor: colors.primarySoft },
  pending: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: touch, paddingVertical: 10, paddingHorizontal: space.lg, backgroundColor: colors.pendingSoft, borderTopWidth: 1, borderTopColor: colors.pendingLine },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  badgeWin: { backgroundColor: colors.primarySoft },
  badgeOther: { backgroundColor: colors.track },
  badgeText: { fontSize: 12, fontWeight: "700" },
});
