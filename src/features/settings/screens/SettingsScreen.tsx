import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/constants/colors";
import { authService } from "@/src/features/auth/services/authService";
import { ROUTES } from "@/src/constants/routes";

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          router.replace("/welcome");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Configure your preferences here.</Text>

      {/* 🔙 Go back to dashboard */}
      <TouchableOpacity
        onPress={() => router.push(ROUTES.HOME)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </TouchableOpacity>

      {/* 🚪 Logout button */}
      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.button, styles.logoutButton]}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.onBackground,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.onBackground,
    marginVertical: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "80%",
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
