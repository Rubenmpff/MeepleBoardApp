/**
 * Step 1 of the registration: choose the game. Opens with the library as a grid (cover, readable name,
 * «Jogo base»/«Expansão», year); a search looks in the library and the catalogue at once, in groups. Any catalogue
 * game can be chosen without owning it. The chosen game stays marked (outline, background, ✓); the form shows a
 * «Escolhido: …» bar above «Continuar».
 */
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import debounce from "lodash.debounce";
import GameCover from "@/src/ui/GameCover";
import { Glyph, SearchField } from "@/src/ui/components";
import { colors, radius, space, strong, type } from "@/src/ui/theme";
import { useUserLibrary } from "@/src/features/library/hooks/useUserLibrary";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { UserGameLibrary } from "@/src/features/library/types/UserGameLibrary";
import { useGameSuggestions } from "../../catalog/hooks/useGameSuggestions";
import { Game } from "../../catalog/types/Game";

/** A choice: library games are ready to use; catalogue games are resolved by name when continuing. */
export type PickedGame = { key: string; game: Game; owned: boolean };

const fromLibrary = (e: UserGameLibrary): Game => ({ ...(e.game ?? {}), id: e.gameId, name: e.gameName, imageUrl: e.gameImageUrl ?? e.game?.imageUrl, bggId: e.bggId,
  isExpansion: e.isExpansion ?? e.game?.isExpansion, minPlayers: e.minPlayers ?? e.game?.minPlayers, maxPlayers: e.maxPlayers ?? e.game?.maxPlayers,
  isCooperative: e.isCooperative ?? e.game?.isCooperative, supportsSoloMode: e.supportsSoloMode ?? e.game?.supportsSoloMode } as Game);
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();

type Props = { value: PickedGame | null; onPick: (picked: PickedGame) => void };

export default function GamePicker({ value, onPick }: Props) {
  const { t } = useTranslation("matches");
  const [query, setQuery] = useState("");
  const { library } = useUserLibrary();
  const { suggestions, loading, fetchSuggestions, resetSuggestions } = useGameSuggestions("all");
  const owned = useMemo(() => (library ?? []).filter(e => e.status === GameLibraryStatus.Owned)
    .map(e => ({ key: `lib-${e.gameId}`, game: fromLibrary(e), owned: true }) as PickedGame)
    .sort((a, b) => a.game.name.localeCompare(b.game.name)), [library]);
  const ownedBgg = useMemo(() => new Set(owned.map(o => o.game.bggId).filter(Boolean)), [owned]);
  const search = useMemo(() => debounce((text: string) => { const q = text.trim(); if (q.length >= 3) fetchSuggestions(q, true); else resetSuggestions(); }, 400), [fetchSuggestions, resetSuggestions]);
  useEffect(() => () => search.cancel(), [search]);

  const q = norm(query.trim());
  const libraryHits = q ? owned.filter(o => norm(o.game.name).includes(q)) : owned;
  const catalog = q.length >= 3 ? suggestions.filter(s => !ownedBgg.has(s.bggId)).map(s => ({ key: `cat-${s.bggId ?? s.name}`, game: s, owned: false }) as PickedGame) : [];
  const picked = (p: PickedGame) => value?.key === p.key;
  const tag = (g: Game) => <Text style={[styles.tag, !g.isExpansion && styles.tagBase]}>{t(g.isExpansion ? "picker.expansion" : "picker.baseGame").toUpperCase()}</Text>;
  const label = (p: PickedGame) => [p.game.name, t(p.game.isExpansion ? "picker.expansion" : "picker.baseGame"), p.game.yearPublished, p.owned ? t("picker.owned") : null].filter(Boolean).join(", ");

  const row = (p: PickedGame, i: number) => <TouchableOpacity key={p.key} accessibilityRole="radio" accessibilityState={{ selected: picked(p) }} accessibilityLabel={label(p)}
    onPress={() => onPick(p)} style={[styles.row, i > 0 && !picked(p) && styles.rowDivider, picked(p) && styles.picked]}>
    <GameCover uri={p.game.imageUrl} size={52} />
    <View style={styles.flex}>
      <Text style={[type.body, strong]} numberOfLines={3}>{p.game.name}</Text>
      <View style={styles.meta}>{tag(p.game)}{!!p.game.yearPublished && <Text style={type.caption}>{p.game.yearPublished}</Text>}
        {p.owned && <View style={styles.owned}><Glyph name="check" size={13} color={colors.primary} /><Text style={[type.micro, strong, { color: colors.primary }]}>{t("picker.owned")}</Text></View>}</View>
    </View>
    {picked(p) && <Glyph name="check-circle" size={24} color={colors.primary} />}
  </TouchableOpacity>;

  return <View style={styles.wrap}>
    <SearchField value={query} onChangeText={text => { setQuery(text); search(text); }} placeholder={t("picker.search")} />
    {!q ? <>
      {owned.length > 0 && <Text style={type.head}>{t("picker.library")}</Text>}
      <View style={styles.grid}>
        {owned.map(p => <TouchableOpacity key={p.key} accessibilityRole="radio" accessibilityState={{ selected: picked(p) }} accessibilityLabel={label(p)}
          onPress={() => onPick(p)} style={styles.cell}>
          <View style={[styles.cover, picked(p) && styles.coverPicked]}>
            <GameCover uri={p.game.imageUrl} size={96} />
            {picked(p) && <View style={styles.coverCheck}><Glyph name="check-circle" size={24} color={colors.primary} /></View>}
          </View>
          <Text style={[type.caption, strong, { color: colors.text }]} numberOfLines={3}>{p.game.name}</Text>
          <View style={styles.meta}>{tag(p.game)}{!!p.game.yearPublished && <Text style={type.micro}>{p.game.yearPublished}</Text>}</View>
        </TouchableOpacity>)}
      </View>
      <Text style={type.caption}>{t(owned.length ? "picker.searchHint" : "picker.searchHintEmpty")}</Text>
    </> : <>
      {libraryHits.length > 0 && <View style={styles.group}>
        <View style={styles.groupHead}><Text style={type.head}>{t("picker.library")}</Text><Text style={type.caption}>{libraryHits.length}</Text></View>
        <View style={styles.card}>{libraryHits.map(row)}</View>
      </View>}
      {(catalog.length > 0 || loading) && <View style={styles.group}>
        <View style={styles.groupHead}><Text style={type.head}>{t("picker.catalog")}</Text>{loading ? <ActivityIndicator color={colors.primary} /> : <Text style={type.caption}>{catalog.length}</Text>}</View>
        {catalog.length > 0 && <View style={styles.card}>{catalog.map(row)}</View>}
      </View>}
      {!loading && libraryHits.length === 0 && catalog.length === 0 && (q.length >= 3
        ? <View style={styles.empty}><Glyph name="magnify" size={30} color={colors.icon} /><Text style={[type.body, strong, styles.center]}>{t("picker.none", { query: query.trim() })}</Text><Text style={[type.caption, styles.center]}>{t("picker.noneHint")}</Text></View>
        : <Text style={type.caption}>{t("picker.typeMore")}</Text>)}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  cell: { width: "30%", flexGrow: 1, maxWidth: "33%", gap: 4 },
  cover: { borderRadius: radius.hero, borderWidth: 2, borderColor: "transparent", alignItems: "center", overflow: "hidden" },
  coverPicked: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  coverCheck: { position: "absolute", top: 4, right: 4, backgroundColor: colors.card, borderRadius: 12 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 2 },
  tag: { ...type.micro, fontSize: 10.5, fontWeight: "700", letterSpacing: 0.3, color: colors.muted, backgroundColor: colors.track, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: "hidden" },
  tagBase: { backgroundColor: colors.primarySoft, color: colors.primary },
  owned: { flexDirection: "row", alignItems: "center", gap: 2 },
  group: { gap: space.sm },
  groupHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  card: { backgroundColor: colors.card, borderRadius: radius.hero, borderCurve: "continuous", borderWidth: 1, borderColor: colors.line, padding: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 64, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.card, borderWidth: 1.5, borderColor: "transparent" },
  rowDivider: { borderTopColor: colors.hair, borderTopWidth: 1 },
  picked: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  flex: { flex: 1, minWidth: 0 },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xl },
  center: { textAlign: "center" },
});
