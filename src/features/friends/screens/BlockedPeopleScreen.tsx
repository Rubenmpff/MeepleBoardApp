/**
 * Definições › «Pessoas bloqueadas»: the blocks the person made, each with «Desbloquear» (confirmed). Unblocking does not
 * bring back the friendship, and a block made by the other person stays.
 */
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/ui/ScreenLayout";
import ScreenState from "@/src/ui/ScreenState";
import { Card, Note, Section } from "@/src/ui/components";
import { colors, space, strong, touch, type } from "@/src/ui/theme";
import communityService from "../services/communityService";
import { BlockedPerson } from "../types/Community";

export default function BlockedPeopleScreen() {
  const { t } = useTranslation("friends");
  const [items, setItems] = useState<BlockedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setItems(await communityService.blocks()); } catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const confirmUnblock = (person: BlockedPerson) => Alert.alert(t("community.unblockTitle", { name: person.userName }), t("community.unblockMessage"), [
    { text: t("text.cancel"), style: "cancel" },
    { text: t("community.unblock"), onPress: async () => {
      try { await communityService.unblock(person.id); setItems(current => current.filter(p => p.id !== person.id)); }
      catch (err: any) { Alert.alert(t("community.unblock"), err?.message); }
    } },
  ]);

  const title = t("community.blockedTitle");
  if (loading) return <ScreenLayout title={title}><ScreenState loading message="" /></ScreenLayout>;
  if (error) return <ScreenLayout title={title}><ScreenState error message={t("community.blockedLoadError")} onRetry={load} retryLabel={t("text.tryAgain")} /></ScreenLayout>;
  return <ScreenLayout title={title}>
    <ScrollView contentContainerStyle={styles.content}>
      {items.length === 0 && <ScreenState message={t("community.blockedEmpty")} />}
      {items.length > 0 && <Section>
        <Card>
          {items.map((person, index) => <TouchableOpacity key={person.id} accessibilityRole="button" accessibilityLabel={`${t("community.unblock")} ${person.userName}`}
            style={[styles.row, index > 0 && styles.separator]} onPress={() => confirmUnblock(person)}>
            <Text style={[type.body, styles.name]} numberOfLines={1}>{person.userName}</Text>
            <Text style={styles.action}>{t("community.unblock")}</Text>
          </TouchableOpacity>)}
        </Card>
        <Note inset>{t("community.blockedNote")}</Note>
      </Section>}
    </ScrollView>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.xs, paddingBottom: 40, gap: space.lg },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: touch + 4, paddingHorizontal: space.lg },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hair },
  name: { flex: 1, minWidth: 0 },
  action: { ...type.body, ...strong, color: colors.primary },
});
