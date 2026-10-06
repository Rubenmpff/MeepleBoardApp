import { ReactNode } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { APP_THEME } from "@/src/styles/appTheme";

type Props = TextInputProps & { label: string; children?: ReactNode };

export default function AuthField({ label, children, style, accessibilityLabel, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput {...inputProps} accessibilityLabel={accessibilityLabel ?? label} style={[styles.input, style]} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: APP_THEME.space.sm },
  label: { ...UI_STYLES.body, color: APP_THEME.colors.text, fontWeight: "700" },
  row: { ...UI_STYLES.field, paddingHorizontal: 0, paddingVertical: 0, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  input: { ...UI_STYLES.body, color: APP_THEME.colors.text, flex: 1, minWidth: 0, minHeight: 52, padding: APP_THEME.space.md },
});
