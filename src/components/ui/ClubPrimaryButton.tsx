import { ReactNode } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { APP_THEME as theme } from "@/src/styles/clubTheme";

type Props = {
  compact?: boolean; title: string; description?: string; icon?: ReactNode; onPress: () => void;
  variant?: "primary" | "secondary"; loading?: boolean; disabled?: boolean;
  accessibilityLabel?: string;
};

export default function PrimaryButton({ title, description, icon, onPress, variant = "primary", compact = false, loading, disabled, accessibilityLabel }: Props) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      style={({ pressed }) => [styles.base, compact && styles.compact, secondary && styles.secondary, (pressed || loading) && styles.pressed, disabled && styles.disabled]}
      onPress={onPress} disabled={!!loading || !!disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={description} accessibilityState={{ disabled: !!loading || !!disabled, busy: !!loading }}
    >
      {loading ? <ActivityIndicator color={secondary ? theme.colors.primary : theme.colors.onPrimary} /> : (
        <>
          {icon}
          <View style={styles.content}>
            <Text style={[styles.title, compact && styles.compactTitle, secondary && styles.secondaryText]}>{title}</Text>
            {!!description && <Text style={[styles.description, secondary && styles.secondaryText]}>{description}</Text>}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48, paddingVertical: 12, paddingHorizontal: theme.space.lg, borderRadius: theme.radius.small,
    backgroundColor: theme.colors.primary, flexDirection: "row", alignItems: "center", gap: theme.space.md,
  },
  compact: { minHeight: 44, padding: 8, borderRadius: 8 },
  compactTitle: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  secondary: { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.small },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: "600", color: theme.colors.onPrimary },
  secondaryText: { color: theme.colors.primary },
  description: { ...theme.text.caption, color: theme.colors.onPrimary, marginTop: theme.space.xs },
});
