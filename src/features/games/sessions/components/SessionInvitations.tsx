import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { GameSession } from "../types/GameSession";
import { normalizeInviteStatus } from "../types/GameSessionPlayer";

export default function SessionInvitations({ session }: { session: GameSession }) {
  const { t } = useTranslation("matches");
  const router = useRouter();
  const guests = session.players.filter(p => !p.isOrganizer);
  const allDeclined = guests.length > 0 && guests.every(p => normalizeInviteStatus(p.status) === "Declined");
  return <View style={{ gap: 12, marginVertical: 12 }}>
    {allDeclined && <Text style={UI_STYLES.body}>{t("sessions.allDeclined")}</Text>}
    <PrimaryButton title={t("sessions.inviteFriends")} variant="secondary"
      onPress={() => router.push({ pathname: "/games/sessions/invite", params: { sessionId: session.id } })} />
  </View>;
}