import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";

import AppHeader from "@/src/features/dashboard/components/AppHeader";
import SectionCard from "@/src/features/dashboard/components/SectionCard";
import PrimaryButton from "@/src/features/dashboard/components/PrimaryButton";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";
import { useLastMatch } from "../hooks/useLastMatch";

export default function DashboardScreen() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: lastMatch, loading } = useLastMatch();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <AppHeader username={user?.username} />

        {/* -------------- Última partida -------------- */}
        <SectionCard>
          <Text style={styles.sectionTitle}>Último jogo jogado</Text>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
          ) : lastMatch ? (
            <>
              <Text style={styles.gameLine}>
                🎲 <Text style={styles.bold}>{String(lastMatch?.name ?? "Sem nome")}</Text>
              </Text>
              <Text style={styles.gameLine}>
                🏆 Vencedor:{" "}
                <Text style={styles.bold}>{String(lastMatch?.winner ?? "Desconhecido")}</Text>
              </Text>
              <Text style={styles.date}>
                📅 {String(lastMatch?.date ?? "Data não disponível")}
              </Text>
            </>
          ) : (
            <View style={styles.emptyBlock}>
              <LottieView
                source={require("@/assets/animations/ghost.json")}
                autoPlay
                loop
                style={styles.lottie}
              />
              <Text style={styles.emptyText}>Ainda não tens partidas registadas.</Text>
            </View>
          )}
        </SectionCard>

        {/* -------------- Ações rápidas -------------- */}
        <SectionCard style={{ alignItems: "center" }}>
          <PrimaryButton
            title="Registrar partida"
            onPress={() => router.push("/games/register-match")}
          />
          <PrimaryButton
            title="Ver minha coleção"
            variant="secondary"
            onPress={() => router.push("/games/library")}
          />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  wrapper: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    color: COLORS.onBackground,
  },
  gameLine: {
    fontSize: 15,
    marginBottom: 2,
    color: COLORS.onBackground,
  },
  bold: {
    fontWeight: "700",
    color: COLORS.onBackground,
  },
  date: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  emptyBlock: {
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    marginTop: 6,
  },
  lottie: {
    width: 140,
    height: 140,
  },
});
