import { View, StyleSheet, ViewProps } from "react-native";
import { APP_THEME as theme } from "@/src/styles/appTheme";

export default function SectionCard({ style, children, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.space.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: theme.colors.text, shadowOpacity: 0.035, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
});
