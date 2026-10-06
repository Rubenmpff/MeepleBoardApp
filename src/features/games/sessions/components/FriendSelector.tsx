import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { FriendLite } from "@/src/features/friends/services/friendshipService";
import { UI_COLORS as colors } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

type Props = {
  friends: FriendLite[]; loading: boolean; error?: string | null;
  selectedIds: string[]; onChange: (ids: string[]) => void;
  onRetry: () => void; onFriends: () => void; emptyMessage: string;
  unavailable?: Record<string, string>; busy?: boolean;
};
const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();

export default function FriendSelector({ friends, loading, error, selectedIds, onChange, onRetry, onFriends, emptyMessage, unavailable = {}, busy = false }: Props) {
  const { t } = useTranslation("matches");
  const [query, setQuery] = useState("");
  const selected = selectedIds.map(id => friends.find(f => f.id === id) ?? { id, userName: t("sessions.unavailableFriend") });
  const results = friends.filter(f => searchable(f.userName).includes(searchable(query)));
  const toggle = (id: string) => {
    if (busy || unavailable[id]) return;
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };
  return (
    <View style={styles.container}>
      <TextInput style={UI_STYLES.field} value={query} onChangeText={setQuery}
        placeholder={t("sessions.searchFriends")} accessibilityLabel={t("sessions.searchFriends")}
        placeholderTextColor={colors.textMuted} autoCorrect={false} returnKeyType="search" editable={!busy} />
      <Text accessibilityLiveRegion="polite" style={UI_STYLES.caption}>{t("sessions.selectedFriends", { count: selectedIds.length })}</Text>
      {!!selected.length && <View style={styles.summary}>{selected.map(friend => (
        <TouchableOpacity key={friend.id} style={styles.chip} onPress={() => onChange(selectedIds.filter(id => id !== friend.id))} disabled={busy}
          accessibilityRole="button" accessibilityLabel={t("sessions.removeSelected", { name: friend.userName })} accessibilityState={{ disabled: busy }}>
          <Text style={styles.chipText}>{friend.userName}</Text><MaterialIcons name="close" size={18} color={colors.primary} />
        </TouchableOpacity>
      ))}</View>}
      {loading ? <ActivityIndicator color={colors.primary} accessibilityLabel={t("sessions.loadingFriends")} /> : error ? (
        <><Text accessibilityRole="alert" style={styles.error}>{error}</Text><PrimaryButton title={t("common:retry")} variant="secondary" onPress={onRetry} disabled={busy} /></>
      ) : !friends.length ? (
        <><Text style={UI_STYLES.body}>{emptyMessage}</Text><PrimaryButton title={t("sessions.openFriends")} variant="secondary" onPress={onFriends} disabled={busy} /></>
      ) : !results.length ? <Text style={UI_STYLES.body}>{t("sessions.noFriendResults")}</Text> : results.map(friend => {
        const checked = selectedIds.includes(friend.id), status = unavailable[friend.id];
        return <TouchableOpacity key={friend.id} style={[styles.row, checked && styles.rowSelected]} onPress={() => toggle(friend.id)} disabled={busy || !!status}
          accessibilityRole="checkbox" accessibilityLabel={status ? `${friend.userName}: ${status}` : t("sessions.selectFriend", { name: friend.userName })}
          accessibilityState={{ checked, disabled: busy || !!status }}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{friend.userName[0]?.toUpperCase()}</Text></View>
          <View style={styles.name}><Text style={UI_STYLES.body}>{friend.userName}</Text>{!!status && <Text style={UI_STYLES.caption}>{status}</Text>}</View>
          <MaterialIcons name={status ? "lock-outline" : checked ? "check-box" : "check-box-outline-blank"} size={24} color={status ? colors.textMuted : colors.primary} />
        </TouchableOpacity>;
      })}
      {!loading && !error && !!friends.length && friends.every(friend => !!unavailable[friend.id]) && <>
        <Text style={UI_STYLES.body}>{t("sessions.noMoreFriends")}</Text>
        <PrimaryButton title={t("sessions.openFriends")} variant="secondary" onPress={onFriends} disabled={busy} />
      </>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 }, summary: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 16, backgroundColor: colors.primarySoft },
  chipText: { ...UI_STYLES.body, color: colors.primary, flexShrink: 1 },
  row: { ...UI_STYLES.card, minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, name: { flex: 1, minWidth: 0 },
  avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.librarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.success, fontWeight: "700", fontSize: 16 }, error: { ...UI_STYLES.body, color: colors.error },
});
