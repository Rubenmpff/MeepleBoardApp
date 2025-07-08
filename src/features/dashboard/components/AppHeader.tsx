import { View, Image, Text, StyleSheet } from "react-native";
import { COLORS } from "@/src/constants/colors";

type Props = { username?: string };

export default function AppHeader({ username = "Meepler" }: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/MeepleBoardLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.hi}>Hi, {username} 👋</Text>
        <Text style={styles.sub}>Welcome back!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 150,
    height: 150,
    marginRight: 8,
  },
  hi: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  sub: {
    fontSize: 12,
    color: COLORS.onBackground,
  },
});
