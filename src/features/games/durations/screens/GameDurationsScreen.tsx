/**
 * «Ver detalhes» of a game's durations: for your average and for the MeepleBoard average, by mode — mean, median,
 * middle half (Q1–Q3), matches far from the rest, counts by method and, for you, what was left out; then by number
 * of players, how it is calculated, your contribution preference and the BGG duration kept apart.
 * Everything comes calculated from the server; community groups below the minimum protection say so.
 */
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/ui/ScreenLayout";
import { Card, Glyph, Row, Section, Segmented } from "@/src/ui/components";
import { colors, space, strong, type } from "@/src/ui/theme";
import { ROUTES } from "@/src/constants/routes";
import { formatDuration } from "@/src/features/games/matches/utils/matchDuration";
import { useGameDurations } from "../hooks/useGameDurations";
import { DurationStats } from "../types/GameDurations";

export default function GameDurationsScreen() {
  const { id, name, bgg } = useLocalSearchParams<{ id: string; name?: string; bgg?: string }>();
  const { t } = useTranslation("games");
  const router = useRouter();
  const { data, loading, error, reload } = useGameDurations(id);
  const [mode, setMode] = useState<"multiplayer" | "solo">("multiplayer");
  const d = (key: string, o?: Record<string, unknown>) => t(`details.durations.${key}`, o ?? {});
  const minutes = (v?: number | null) => v == null ? "—" : formatDuration(v);

  const block = (title: string, dot: string, s: DurationStats | undefined, personal: boolean) => {
    const rows: [string, string][] = [];
    if (s?.available && s.mean != null) {
      rows.push([d("mean"), minutes(s.mean)]);
      if (s.median != null) rows.push([d("median"), minutes(s.median)]);
      if (s.q1 != null && s.q3 != null) rows.push([d("middle"), `${minutes(s.q1)} – ${minutes(s.q3)}`]);
      rows.push([d("used"), String(s.count)]);
      rows.push([d("methods"), `${s.measured} · ${s.estimated} · ${s.notStated}`]);
      if (s.median != null) rows.push([d("distant"), personal && s.distantValues?.length ? `${s.distant} · ${s.distantValues.map(formatDuration).join(", ")}` : String(s.distant)]);
    }
    if (personal) {
      const out = [s?.excludedUnknown ? d("excludedUnknown", { count: s.excludedUnknown }) : null, s?.excludedMissing ? d("excludedMissing", { count: s.excludedMissing }) : null,
        s?.excludedZero ? d("excludedZero", { count: s.excludedZero }) : null].filter(Boolean).join(" · ");
      if (out) rows.push([d("excluded"), out]);
    }
    const empty = personal ? d("mineEmpty") : d("communityEmpty");
    return <View style={styles.block}>
      <View style={styles.blockHead}><View style={[styles.dot, { backgroundColor: dot }]} /><Text style={type.head} accessibilityRole="header">{title}</Text></View>
      <Card>
        {rows.length ? rows.map(([k, v], i) => <Row key={k} first={i === 0} title={k} value={v} />) : <Row first title={empty} subtitle={personal ? undefined : d("communityEmptyHint")} />}
      </Card>
      {rows.length > 0 && <Text style={type.caption}>{s?.median == null ? d("fewValues") : personal ? d("yoursNote") : d("communityNote")}</Text>}
    </View>;
  };

  const groups = data?.personal.byPlayers.map((b, i) => ({ players: b.players, mine: b.stats, community: data.community.byPlayers[i]?.stats })) ?? [];
  return <ScreenLayout title={d("screenTitle", { game: name ?? "" })}>
    <ScrollView contentContainerStyle={styles.content}>
      <Segmented role="button" items={[{ key: "multiplayer", label: d("multiplayer") }, { key: "solo", label: d("solo") }]} value={mode} onChange={setMode} />
      {loading && !data ? <ActivityIndicator color={colors.primary} /> : error && !data
        ? <TouchableOpacity accessibilityRole="button" onPress={() => { void reload(); }}><Text style={type.caption}>{d("loadError")}</Text><Text style={styles.link}>{d("retry")}</Text></TouchableOpacity>
        : <>
          {block(d("yours"), colors.gold, data?.personal[mode], true)}
          {block(d("meepleBoard"), colors.primary, data?.community[mode], false)}
          {mode === "multiplayer" && <Section title={d("byPlayers")}>
            <Card>
              <View style={[styles.tr, styles.th]}>
                <Text style={[styles.thText, styles.c1]}>{d("players")}</Text>
                <Text style={[styles.thText, styles.c2]}>{d("yours")}</Text>
                <Text style={[styles.thText, styles.c2]}>{d("meepleBoard")}</Text>
              </View>
              {groups.map(g => <View key={g.players} style={styles.tr} accessible>
                <Text style={[type.body, styles.c1]}>{g.players === 5 ? d("fivePlus") : String(g.players)}</Text>
                <View style={styles.c2}>
                  <Text style={[type.body, strong, styles.right]}>{g.mine.available && g.mine.mean != null ? minutes(g.mine.mean) : "—"}</Text>
                  <Text style={[type.micro, styles.right]}>{g.mine.count ? d("matches", { count: g.mine.count }) : d("noMatches")}</Text>
                </View>
                <View style={styles.c2}>
                  <Text style={[type.body, strong, styles.right]}>{g.community?.available && g.community.mean != null ? minutes(g.community.mean) : d("insufficient")}</Text>
                  {g.community?.available && <Text style={[type.micro, styles.right]}>{d("matches", { count: g.community.count })}</Text>}
                </View>
              </View>)}
            </Card>
            <Text style={type.caption}>{d("protectionNote")}</Text>
          </Section>}
          <Section title={d("how")}>
            <Card padded>
              <View style={{ gap: space.sm }}>
                {["howMean", "howMedian", "howMiddle", "howDistant", "howOut", "howNotStated", "howCommunity"].map(k => <Text key={k} style={type.caption}>{d(k)}</Text>)}
              </View>
            </Card>
          </Section>
          <Card>
            <Row first title={d("contributes")} subtitle={data?.viewerContributes ? d("contributesOn") : d("contributesOff")}
              lead={<Glyph name="shield-account-outline" size={20} color={colors.icon} />} onPress={() => router.push(ROUTES.SETTINGS as never)} />
          </Card>
          {!!bgg && <View style={styles.note}><Glyph name="information-outline" size={14} color={colors.muted} /><Text style={[type.micro, styles.flex]}>{d("bggNote", { value: bgg })}</Text></View>}
        </>}
    </ScrollView>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.xs, paddingBottom: 40, gap: space.xl },
  block: { gap: space.sm },
  blockHead: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tr: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: colors.hair },
  th: { borderTopWidth: 0, paddingVertical: space.sm, backgroundColor: colors.tint },
  thText: { ...type.micro, ...strong, letterSpacing: 0.3, textTransform: "uppercase" },
  c1: { width: 96 },
  c2: { flex: 1, alignItems: "flex-end" },
  right: { textAlign: "right" },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  link: { ...type.body, ...strong, color: colors.primary },
  flex: { flex: 1, minWidth: 0 },
});
