import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS } from "@/src/constants/colors";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
};

export default function PrimaryButton({ title, onPress, variant = "primary", loading }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === "secondary" && styles.secondary,
        loading && styles.disabled,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    marginVertical: 6,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
