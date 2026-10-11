import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, space, type } from "@/src/ui/theme";
import PrimaryButton from "./PrimaryButton";

type Props = { message: string; loading?: boolean; error?: boolean; onRetry?: () => void; retryLabel?: string };

// Loading, error and empty states share one calm layout; errors always offer a retry when one exists.
export default function ScreenState({ message, loading, error, onRetry, retryLabel }: Props) {
  return (
    <View style={styles.container} accessibilityState={{ busy: !!loading }}>
      {loading ? <ActivityIndicator color={colors.primary} size="large" /> :
        <MaterialCommunityIcons name={error ? "cloud-alert-outline" : "dice-multiple-outline"} size={36} color={error ? colors.muted : colors.icon} accessible={false} />}
      <Text style={styles.message} accessibilityRole={error ? "alert" : undefined}>{message}</Text>
      {onRetry && retryLabel && <View style={styles.action}><PrimaryButton title={retryLabel} onPress={onRetry} variant="secondary" /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 40, paddingHorizontal: space.xl, gap: space.md, width: "100%", alignItems: "center" },
  message: { ...type.body, color: colors.muted, textAlign: "center" },
  action: { alignSelf: "stretch", marginTop: space.sm },
});
