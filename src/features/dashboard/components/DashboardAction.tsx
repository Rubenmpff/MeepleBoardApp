import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { DASHBOARD_THEME as theme } from "../styles/dashboardTheme";

type Props = {
  title: string; description: string; icon: keyof typeof MaterialIcons.glyphMap;
  color: string; background: string; onPress: () => void;
};

export default function DashboardAction({ title, description, icon, color, background, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description}
    >
      <View style={[styles.icon, { backgroundColor: background }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={theme.colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76, flexDirection: "row", alignItems: "center", gap: theme.space.md,
    padding: theme.space.lg, backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border,
  },
  pressed: { backgroundColor: theme.colors.primarySoft },
  icon: { width: 44, height: 44, borderRadius: theme.radius.small, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, minWidth: 0 },
  title: { ...theme.text.body, color: theme.colors.text, fontWeight: "700" },
  description: { ...theme.text.caption, color: theme.colors.muted, marginTop: theme.space.xs },
});
