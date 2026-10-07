import { ReactNode, useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { AUTH_COLORS as colors } from "../styles/authTheme";
import { useAuthFieldFocus } from "./AuthLayout";

type Props = TextInputProps & { label: string; children?: ReactNode };
export default function AuthField({ label, children, style, accessibilityLabel, onFocus, onBlur, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);
  const reveal = useAuthFieldFocus();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, focused && styles.focused]}>
        <TextInput {...inputProps} accessibilityLabel={accessibilityLabel ?? label} selectionColor={colors.primary}
          style={[styles.input, style]}
          onFocus={event => { setFocused(true); reveal(event.target); onFocus?.(event); }}
          onBlur={event => { setFocused(false); onBlur?.(event); }} />
        {children}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 16, lineHeight: 24, color: colors.text, fontWeight: "700" },
  row: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.field, flexDirection: "row", alignItems: "center" },
  focused: { borderColor: colors.primary },
  input: { fontSize: 16, lineHeight: 24, color: colors.text, flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12 },
});
