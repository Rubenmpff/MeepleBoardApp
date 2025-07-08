import { View, StyleSheet, ViewProps } from "react-native";
import { COLORS } from "@/src/constants/colors";

export default function SectionCard({ style, children, ...rest }: ViewProps) {
  return (
    <View
      style={[styles.card, style]}
      accessibilityRole="summary"
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, // melhor que "#fff" se usares tema
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginVertical: 8,
  },
});
