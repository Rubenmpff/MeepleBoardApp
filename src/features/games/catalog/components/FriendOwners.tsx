/**
 * «Amigos que têm este jogo»: accepted friends with the game as «Tenho» whose library you may see
 * (the API applies the rules). A few avatars with name and profile access; «Ver todos (n)» opens the full list.
 * With nobody visible, a quiet line that does not claim that no friend owns it.
 */
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Sheet from "@/src/ui/Sheet";
import { Avatar, Card, Glyph, Row } from "@/src/ui/components";
import { colors, space, strong, touch, type } from "@/src/ui/theme";
import { GameFriendOwner } from "../services/gameService";

const PREVIEW = 4;
// One soft colour per person, so neighbours are told apart even with the same initial.
const TINTS = [["#EEE6F8", colors.friend], ["#E3F0EA", colors.primary], ["#FBEFD9", colors.pendingIcon], ["#F6E6EC", "#9C3D5E"]] as const;

type Props = { owners: GameFriendOwner[] | null; loading: boolean; error: boolean; onRetry: () => void; onOpen: (userId: string) => void };

export default function FriendOwners({ owners, loading, error, onRetry, onOpen }: Props) {
  const { t } = useTranslation("games");
  const [all, setAll] = useState(false);
  const list = owners ?? [];
  // Up to four fit; with more, three and a «+n» tile.
  const shown = list.length > PREVIEW ? list.slice(0, PREVIEW - 1) : list;
  const open = (userId: string) => { setAll(false); onOpen(userId); };
  const showAll = t("details.friends.showAll", { count: list.length });
  return <View style={styles.section}>
    <View style={styles.head}>
      <Text style={[type.head, styles.flex]} accessibilityRole="header">{t("details.friends.title")}</Text>
      {list.length > PREVIEW && <TouchableOpacity style={styles.more} onPress={() => setAll(true)} accessibilityRole="button" accessibilityLabel={showAll}>
        <Text style={[type.body, strong, { color: colors.primary }]}>{showAll}</Text>
      </TouchableOpacity>}
    </View>
    {loading && !owners ? <Text style={[type.caption, styles.pad]}>{t("details.friends.loading")}</Text>
      : error ? <Card><Row first title={t("details.friends.error")} subtitle={t("ui.retry")} tone="link" onPress={onRetry} /></Card>
      : list.length === 0 ? <View style={styles.quiet}>
        <Glyph name="account-heart-outline" size={18} color={colors.icon} />
        <Text style={[type.caption, styles.flex]}>{t("details.friends.none")}</Text>
      </View>
      : <>
        <View style={styles.strip}>
          {shown.map((f, i) => <TouchableOpacity key={f.userId} style={styles.friend} onPress={() => open(f.userId)} accessibilityRole="button"
            accessibilityLabel={f.userName} accessibilityHint={t("details.friends.openProfile")}>
            <View style={[styles.ring, { backgroundColor: TINTS[i % TINTS.length][0] }]}><Avatar name={f.userName} uri={f.profilePictureUrl} size={52} tint={TINTS[i % TINTS.length]} /></View>
            <Text style={styles.name} numberOfLines={3}>{f.userName}</Text>
          </TouchableOpacity>)}
          {list.length > PREVIEW && <TouchableOpacity style={styles.friend} onPress={() => setAll(true)} accessibilityRole="button" accessibilityLabel={showAll}>
            <View style={[styles.ring, styles.plus]}><Text style={[type.head, { color: colors.muted }]}>+{list.length - shown.length}</Text></View>
            <Text style={styles.name}>{t("details.friends.more", { count: list.length - shown.length })}</Text>
          </TouchableOpacity>}
        </View>
        <Text style={[type.micro, styles.pad]}>{t("details.friends.note")}</Text>
      </>}
    <Sheet visible={all} title={t("details.friends.title")} onClose={() => setAll(false)} closeLabel={t("details.friends.sheetClose")}
      right={{ label: t("details.friends.sheetClose"), onPress: () => setAll(false) }}>
      <Card>
        {list.map((f, i) => <Row key={f.userId} first={i === 0} inset={68} lead={<Avatar name={f.userName} uri={f.profilePictureUrl} tint={TINTS[i % TINTS.length]} />}
          title={f.userName} accessibilityLabel={f.userName} accessibilityHint={t("details.friends.openProfile")} onPress={() => open(f.userId)} />)}
      </Card>
      <Text style={type.micro}>{t("details.friends.note")}</Text>
    </Sheet>
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  head: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg },
  flex: { flex: 1, minWidth: 0 },
  more: { minHeight: touch, justifyContent: "center" },
  pad: { paddingHorizontal: space.lg },
  quiet: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: space.lg },
  strip: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  friend: { width: 84, alignItems: "center", gap: 6, paddingVertical: space.xs },
  ring: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  plus: { backgroundColor: colors.track },
  name: { ...type.micro, color: colors.text, textAlign: "center" },
});
