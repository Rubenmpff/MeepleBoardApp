/**
 * «Amigos que têm este jogo»: accepted friends with the game as «Tenho» whose library you may see
 * (the API applies the rules). A few at first, «Ver todos» when there are more.
 */
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Avatar, Card, Row, Section } from "@/src/ui/components";
import { colors, type } from "@/src/ui/theme";
import { GameFriendOwner } from "../services/gameService";

const PREVIEW = 4;

type Props = { owners: GameFriendOwner[] | null; loading: boolean; error: boolean; onRetry: () => void; onOpen: (userId: string) => void };

export default function FriendOwners({ owners, loading, error, onRetry, onOpen }: Props) {
  const { t } = useTranslation("games");
  const [all, setAll] = useState(false);
  const list = owners ?? [];
  const shown = all ? list : list.slice(0, PREVIEW);
  return <Section title={t("details.friends.title")} note={list.length ? String(list.length) : undefined}>
    <Card>
      {loading && !owners ? <Text style={[type.body, styles.muted, styles.text]}>{t("details.friends.loading")}</Text>
        : error ? <Row first title={t("details.friends.error")} subtitle={t("ui.retry")} tone="link" onPress={onRetry} />
        : list.length === 0 ? <Text style={[type.body, styles.muted, styles.text]}>{t("details.friends.none")}</Text>
        : <>
          {shown.map((f, i) => <Row key={f.userId} first={i === 0} inset={68} lead={<Avatar name={f.userName} uri={f.profilePictureUrl} />}
            title={f.userName} accessibilityLabel={f.userName} accessibilityHint={t("details.friends.openProfile")} onPress={() => onOpen(f.userId)} />)}
          {list.length > PREVIEW && <Row title={t(all ? "details.showFewer" : "details.friends.showAll", { count: list.length })} tone="link"
            end={all ? "collapse" : "expand"} onPress={() => setAll(v => !v)} />}
        </>}
    </Card>
  </Section>;
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  text: { padding: 16 },
});
