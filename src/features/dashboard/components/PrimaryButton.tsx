import { ReactNode } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { DASHBOARD_THEME as theme } from "../styles/dashboardTheme";

type Props = {
  title: string; description?: string; icon?: ReactNode; onPress: () => void;
  variant?: "primary" | "secondary"; loading?: boolean;
};

export default function PrimaryButton({ title, description, icon, onPress, variant = "primary", loading }: Props) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      style={({ pressed }) => [styles.base, secondary && styles.secondary, (pressed || loading) && styles.pressed]}
      onPress={onPress} disabled={loading} accessibilityRole="button" accessibilityLabel={title}
      accessibilityHint={description} accessibilityState={{ disabled: !!loading, busy: !!loading }}
    >
      {loading ? <ActivityIndicator color={secondary ? theme.colors.primary : theme.colors.onPrimary} /> : (
        <>
          {icon}
          <View style={styles.content}>
            <Text style={[styles.title, secondary && styles.secondaryText]}>{title}</Text>
            {!!description && <Text style={[styles.description, secondary && styles.secondaryText]}>{description}</Text>}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52, padding: theme.space.lg, borderRadius: theme.radius.card,
    backgroundColor: theme.colors.primary, flexDirection: "row", alignItems: "center", gap: theme.space.md,
  },
  secondary: { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.small },
  pressed: { opacity: 0.8 },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, lineHeight: 24, fontWeight: "700", color: theme.colors.onPrimary },
  secondaryText: { color: theme.colors.primary },
  description: { ...theme.text.caption, color: theme.colors.onPrimary, marginTop: theme.space.xs },
});
