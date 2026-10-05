import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { APP_THEME as theme } from "@/src/styles/appTheme";
import PrimaryButton from "./PrimaryButton";

type Props = { message: string; loading?: boolean; error?: boolean; onRetry?: () => void; retryLabel?: string };

export default function ScreenState({ message, loading, error, onRetry, retryLabel }: Props) {
  return (
    <View style={styles.container} accessibilityState={{ busy: !!loading }}>
      {loading && <ActivityIndicator color={theme.colors.primary} size="large" />}
      <Text style={styles.message} accessibilityRole={error ? "alert" : undefined}>{message}</Text>
      {onRetry && retryLabel && <PrimaryButton title={retryLabel} onPress={onRetry} variant="secondary" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.space.xl, gap: theme.space.lg, width: "100%", alignItems: "stretch" },
  message: { ...theme.text.body, color: theme.colors.muted, textAlign: "center" },
});
