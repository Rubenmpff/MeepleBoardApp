import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/constants/colors";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require('@/assets/MeepleBoardLogo.png')} style={styles.logo} />

      {/* Título e descrição */}
      <Text style={styles.title}>Welcome to the{"\n"}MeepleBoard community</Text>
      <Text style={styles.subtitle}>
        Discover new board games, keep track of your collection, and join the conversation
        with other board game enthusiasts.
      </Text>

      {/* Botões */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/signin")}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Log in</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.signUpButton]}
        onPress={() => router.push("/signup")}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Sign up</Text>
      </TouchableOpacity>

      {/* Termos e políticas */}
      <Text style={styles.termsText}>
        <Text>By signing up, you agree to our </Text>
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("https://meepleboard.com/terms")}
        >
          Terms of Service
        </Text>
        <Text>{', '}</Text>
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("https://meepleboard.com/privacy")}
        >
          Privacy Policy
        </Text>
        <Text>{', and '}</Text>
        <Text
          style={styles.link}
          onPress={() => Linking.openURL("https://meepleboard.com/guidelines")}
        >
          Community Guidelines
        </Text>
        <Text>{'.'}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 350,
    height: 220,
    resizeMode: "contain",
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.onBackground,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: COLORS.onBackground,
    marginBottom: 50,
  },
  button: {
    width: "90%",
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 8,
  },
  signUpButton: {
    backgroundColor: COLORS.secondary,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    color: COLORS.onBackground,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
