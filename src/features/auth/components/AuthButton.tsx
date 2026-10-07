import { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type PrimaryButton from "@/src/components/ui/PrimaryButton";
import { AUTH_COLORS as colors } from "../styles/authTheme";

export default function AuthButton({ title, description, icon, onPress, variant = "primary", loading, disabled, accessibilityLabel }: ComponentProps<typeof PrimaryButton>) {
  const secondary = variant === "secondary";
  const inactive = !!loading || !!disabled;
  return (
    <Pressable onPress={onPress} disabled={inactive} accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title} accessibilityHint={description}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, pressed && styles.pressed, inactive && styles.inactive]}>
      {loading ? <ActivityIndicator color={secondary || inactive ? colors.primary : colors.onPrimary} /> : <>
        {icon}
        <View style={styles.content}>
          <Text style={[styles.title, (secondary || inactive) && styles.secondaryText]}>{title}</Text>
          {!!description && <Text style={[styles.description, (secondary || inactive) && styles.secondaryText]}>{description}</Text>}
        </View>
      </>}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  secondary: { backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.primary },
  pressed: { opacity: 0.85 }, inactive: { backgroundColor: "#E3E9E5", borderWidth: 1, borderColor: colors.border },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, lineHeight: 24, fontWeight: "700", textAlign: "center", color: colors.onPrimary },
  secondaryText: { color: colors.primary },
  description: { fontSize: 15, lineHeight: 22, color: colors.onPrimary, textAlign: "center" },
});
