import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { GameSessionPlayer, normalizeInviteStatus } from "../types/GameSessionPlayer";

export default function SessionAttendance({ players, compact = false }: { players: GameSessionPlayer[]; compact?: boolean }) {
  const { t } = useTranslation("matches");
  const count = (status: string) => players.filter(p => normalizeInviteStatus(p.status) === status).length;
  return <View style={{ gap: 4, flexShrink: 1 }}>
    <Text style={compact ? UI_STYLES.caption : UI_STYLES.body}>{t("sessions.confirmedPeople", { count: count("Accepted") })}</Text>
    {!compact && <Text style={UI_STYLES.caption}>{t("sessions.includesOrganizer")}</Text>}
    <Text style={UI_STYLES.caption}>{t("sessions.pendingPeople", { count: count("Pending") })} · {t("sessions.declinedPeople", { count: count("Declined") })}</Text>
  </View>;
}
