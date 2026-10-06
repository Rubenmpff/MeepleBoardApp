import { ReactNode } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { APP_THEME as theme } from "@/src/styles/appTheme";

type Props = {
  title: string; description?: string; icon?: ReactNode; onPress: () => void;
  variant?: "primary" | "secondary"; loading?: boolean; disabled?: boolean;
  accessibilityLabel?: string;
};

export default function PrimaryButton({ title, description, icon, onPress, variant = "primary", loading, disabled, accessibilityLabel }: Props) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      style={({ pressed }) => [styles.base, secondary && styles.secondary, (pressed || loading) && styles.pressed, disabled && styles.disabled]}
      onPress={onPress} disabled={!!loading || !!disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={description} accessibilityState={{ disabled: !!loading || !!disabled, busy: !!loading }}
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
  disabled: { opacity: 0.45 },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, lineHeight: 24, fontWeight: "700", color: theme.colors.onPrimary },
  secondaryText: { color: theme.colors.primary },
  description: { ...theme.text.caption, color: theme.colors.onPrimary, marginTop: theme.space.xs },
});
