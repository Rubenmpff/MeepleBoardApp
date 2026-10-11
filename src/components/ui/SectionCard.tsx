import { View, StyleSheet, ViewProps } from "react-native";
import { colors, radius, space } from "@/src/ui/theme";

export default function SectionCard({ style, children, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderCurve: "continuous", padding: space.lg, borderWidth: 1, borderColor: colors.line },
});
