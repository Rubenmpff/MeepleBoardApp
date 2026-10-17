import { ReactNode } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { colors, radius, space, touch } from "@/src/ui/theme";

type Props = {
  title: string; description?: string; icon?: ReactNode; onPress: () => void;
  variant?: "primary" | "secondary" | "danger"; loading?: boolean; disabled?: boolean;
  accessibilityLabel?: string;
};

// Shared button: green primary, soft green secondary, red text for risky actions.
export default function PrimaryButton({ title, description, icon, onPress, variant = "primary", loading, disabled, accessibilityLabel }: Props) {
  const fg = variant === "primary" ? colors.onPrimary : variant === "danger" ? colors.danger : colors.primary;
  const centred = !description;
  return (
    <Pressable
      style={({ pressed }) => [styles.base, variant === "secondary" && styles.secondary, variant === "danger" && styles.danger, centred && styles.centred, (pressed || loading) && styles.pressed, disabled && styles.disabled]}
      onPress={onPress} disabled={!!loading || !!disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={description} accessibilityState={{ disabled: !!loading || !!disabled, busy: !!loading }}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon}
          <View style={centred ? styles.centredContent : styles.content}>
            <Text style={[styles.title, { color: fg }, centred && styles.centredText]}>{title}</Text>
            {!!description && <Text style={[styles.description, { color: fg }]}>{description}</Text>}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, paddingVertical: 12, paddingHorizontal: space.lg, borderRadius: radius.control, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", gap: space.md },
  centred: { justifyContent: "center", gap: space.sm },
  secondary: { backgroundColor: colors.primarySoft },
  danger: { backgroundColor: "transparent", minHeight: touch },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  content: { flex: 1, minWidth: 0 },
  centredContent: { flexShrink: 1 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  centredText: { textAlign: "center" },
  description: { fontSize: 13, lineHeight: 18, marginTop: 2, opacity: 0.9 },
});
