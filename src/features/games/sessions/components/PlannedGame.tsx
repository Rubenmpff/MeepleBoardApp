/**
 * The planned game of a session: optional, it only says what the organizer has in mind. It never limits which
 * games are recorded in the session, and changing it does not touch matches or times.
 *   PlannedGameField — the field or row that shows it, with «Alterar» (or «Escolher jogo» when there is none).
 *   PlannedGamePicker — «Sem jogo definido», your library, or a catalogue search.
 */
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Sheet from "@/src/ui/Sheet";
import { Card, Glyph, Row } from "@/src/ui/components";
import { colors, radius, space, strong, touch, type } from "@/src/ui/theme";
import { GameSelector } from "@/src/features/games/catalog/components/GameSelector";
import { useUserLibrary } from "@/src/features/library/hooks/useUserLibrary";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";

export type PlannedGame = { id: string; name: string; imageUrl?: string | null };

export function GameThumb({ game, size = 44 }: { game?: PlannedGame | null; size?: number }) {
  return <View style={[styles.thumb, { width: size, height: size }]} accessible={false}>
    {game?.imageUrl ? <Image source={{ uri: game.imageUrl }} style={styles.image} resizeMode="contain" accessible={false} /> : <Glyph name="dice-5" size={size / 2} color={colors.icon} />}
  </View>;
}

/** In a form: the chosen game with «Alterar», or a quiet «Escolher jogo». */
export function PlannedGameField({ game, note, onChange }: { game: PlannedGame | null; note?: string; onChange: () => void }) {
  const { t } = useTranslation("matches");
  if (!game) return <TouchableOpacity style={[styles.field, styles.empty]} onPress={onChange} accessibilityRole="button" accessibilityLabel={`${t("sessions.plannedGameOptional")}: ${t("sessions.plannedChoose")}`}>
    <Glyph name="plus" size={18} color={colors.primary} />
    <Text style={[type.body, strong, { color: colors.primary }]}>{t("sessions.plannedChoose")}</Text>
  </TouchableOpacity>;
  return <TouchableOpacity style={styles.field} onPress={onChange} accessibilityRole="button" accessibilityLabel={`${t("sessions.plannedGameOptional")}: ${game.name}`} accessibilityHint={t("sessions.plannedChange")}>
    <GameThumb game={game} />
    <View style={styles.flex}>
      <Text style={[type.body, strong]} numberOfLines={2}>{game.name}</Text>
      {!!note && <Text style={type.caption}>{note}</Text>}
    </View>
    <Text style={[type.body, strong, { color: colors.primary }]}>{t("sessions.plannedChange")}</Text>
  </TouchableOpacity>;
}

export function PlannedGamePicker({ visible, current, onClose, onPick }: { visible: boolean; current: PlannedGame | null; onClose: () => void; onPick: (game: PlannedGame | null) => void }) {
  const { t } = useTranslation("matches");
  const { library = [] } = useUserLibrary();
  // Your games first («Tenho», then the rest), once each, by name.
  const mine = [...new Map(library.map(e => [e.gameId, e])).values()]
    .sort((a, b) => Number(b.status === GameLibraryStatus.Owned) - Number(a.status === GameLibraryStatus.Owned) || a.gameName.localeCompare(b.gameName));
  const pick = (game: PlannedGame | null) => { onPick(game); onClose(); };
  // The current game first when it is not in your library, so the choice in use is always visible.
  const outside = current && !mine.some(e => e.gameId === current.id) ? current : null;
  return <Sheet visible={visible} title={t("sessions.plannedPickTitle")} onClose={onClose} closeLabel={t("sessions.plannedCancel")} left={{ label: t("sessions.plannedCancel"), onPress: onClose }}>
    <Card>
      <Row first title={t("sessions.plannedNone")} subtitle={t("sessions.plannedNoneHint")} inset={68} lead={<View style={styles.thumbNone}><Glyph name="circle-off-outline" size={20} color={colors.icon} /></View>}
        end="check" selected={!current} onPress={() => pick(null)} />
    </Card>
    {outside && <Card>
      <Row first inset={68} title={outside.name} lead={<GameThumb game={outside} size={40} />} end="check" selected onPress={() => pick(outside)} />
    </Card>}
    {mine.length > 0 && <View style={styles.group}>
      <Text style={styles.overline}>{t("sessions.plannedFromLibrary")}</Text>
      <Card>
        {mine.map((e, i) => <Row key={e.gameId} first={i === 0} inset={68} title={e.gameName} lead={<GameThumb game={{ id: e.gameId, name: e.gameName, imageUrl: e.gameImageUrl }} size={40} />}
          end="check" selected={current?.id === e.gameId} onPress={() => pick({ id: e.gameId, name: e.gameName, imageUrl: e.gameImageUrl })} />)}
      </Card>
    </View>}
    <View style={styles.group}>
      <Text style={styles.overline}>{t("sessions.plannedSearch")}</Text>
      <GameSelector appearance="refresh" onSelect={game => pick({ id: game.id, name: game.name, imageUrl: game.imageUrl })} />
    </View>
  </Sheet>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  thumb: { borderRadius: radius.control - 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  thumbNone: { width: 40, height: 40, borderRadius: radius.control - 2, backgroundColor: "#EEE6F8", alignItems: "center", justifyContent: "center" },
  image: { width: "88%", height: "88%" },
  field: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 58, paddingVertical: space.sm, paddingLeft: space.sm, paddingRight: space.md,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background },
  empty: { borderStyle: "dashed", paddingLeft: 14, minHeight: touch + 6 },
  group: { gap: space.xs },
  overline: { ...type.micro, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", paddingHorizontal: space.xs },
});
