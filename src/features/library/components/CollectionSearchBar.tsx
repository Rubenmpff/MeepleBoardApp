// src/features/library/components/CollectionSearchBar.tsx
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors, radius, space, touch, type } from "@/src/ui/theme";

type Props = { value: string; onChangeText: (text: string) => void };

export function CollectionSearchBar({ value, onChangeText }: Props) {
  const { t: uiT } = useTranslation("library");
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
      <TextInput style={[type.body, styles.input]} value={value} onChangeText={onChangeText} placeholder={uiT("ui.searchPlaceholder")}
        accessibilityLabel={uiT("ui.searchPlaceholder")} placeholderTextColor={colors.muted} returnKeyType="search" autoCorrect={false} />
      {value.length > 0 && <TouchableOpacity onPress={() => onChangeText("")} style={styles.clear} accessibilityRole="button" accessibilityLabel={uiT("ui.clearSearch")}>
        <MaterialCommunityIcons name="close-circle" size={18} color={colors.muted} />
      </TouchableOpacity>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch, paddingLeft: space.md, borderWidth: 1, borderColor: colors.field, borderRadius: radius.control, backgroundColor: colors.card, marginBottom: space.sm },
  input: { flex: 1, minHeight: touch, paddingVertical: 10, color: colors.text },
  clear: { width: touch, height: touch, alignItems: "center", justifyContent: "center" },
});
