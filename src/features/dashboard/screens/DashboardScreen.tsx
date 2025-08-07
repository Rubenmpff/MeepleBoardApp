import React, { useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

import AppHeader from "@/src/features/dashboard/components/AppHeader";
import SectionCard from "@/src/features/dashboard/components/SectionCard";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";
import { useLastMatch } from "../hooks/useLastMatch";
import { ROUTES } from "@/src/constants/routes";

export default function DashboardScreen() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: lastMatch, loading } = useLastMatch();

  const quickActions = [
    {
      title: "Registar Partida Rápida",
      description: "Regista uma partida isolada ou uma jogada anterior.",
      icon: <MaterialIcons name="sports-esports" size={40} color={COLORS.primary} />,
      onPress: () => router.push("/games/register-match"),
      borderColor: COLORS.primary,
    },
    {
      title: "Gerir Sessões",
      description: "Cria ou continua uma sessão de jogo ativa.",
      icon: <MaterialIcons name="event-note" size={40} color={COLORS.secondary} />,
      onPress: () => router.push(ROUTES.SESSIONS),
      borderColor: COLORS.secondary,
    },
    {
      title: "Ver a Minha Coleção",
      description: "Consulta todos os teus jogos e expansões.",
      icon: <MaterialCommunityIcons name="bookshelf" size={40} color={COLORS.success} />,
      onPress: () => router.push("/games/library"),
      borderColor: COLORS.success,
    },
  ];

  const AnimatedCard = ({ action }: any) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
    };

    const onPressOut = () => {
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
      action.onPress();
    };

    return (
      <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View style={[styles.actionCard, { borderColor: action.borderColor, transform: [{ scale }] }]}>
          <View style={styles.iconWrapper}>{action.icon}</View>
          <Text style={styles.cardTitle}>{action.title}</Text>
          <Text style={styles.cardDesc}>{action.description}</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <AppHeader username={user?.userName} />

        {/* Última partida */}
        <SectionCard>
          <Text style={styles.sectionTitle}>Último jogo jogado</Text>
          {loading ? (
            <Text style={styles.loadingText}>A carregar...</Text>
          ) : lastMatch ? (
            <>
              <Text style={styles.gameLine}>🎲 {lastMatch.name ?? "Sem nome"}</Text>
              <Text style={styles.gameLine}>🏆 {lastMatch.winner ?? "Desconhecido"}</Text>
              <Text style={styles.date}>📅 {lastMatch.date ?? "Data não disponível"}</Text>
            </>
          ) : (
            <View style={styles.emptyBlock}>
              <LottieView source={require("@/assets/animations/ghost.json")} autoPlay loop style={styles.lottie} />
              <Text style={styles.emptyText}>Ainda não tens partidas registadas.</Text>
            </View>
          )}
        </SectionCard>

        {/* Ações rápidas */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Ações rápidas</Text>
        <View style={styles.cardGrid}>
          {quickActions.map((action, index) => (
            <AnimatedCard key={index} action={action} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  wrapper: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24, backgroundColor: COLORS.background },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 8, color: COLORS.onBackground },
  loadingText: { textAlign: "center", color: COLORS.onBackground, marginTop: 16 },
  gameLine: { fontSize: 15, marginBottom: 2, color: COLORS.onBackground },
  date: { fontSize: 13, color: "#666", marginTop: 4 },
  emptyBlock: { alignItems: "center", paddingVertical: 12 },
  emptyText: { fontSize: 14, color: "#888", marginTop: 6 },
  lottie: { width: 120, height: 120 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: "center",
  },
  iconWrapper: { marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", textAlign: "center", color: COLORS.onBackground, marginBottom: 6 },
  cardDesc: { fontSize: 12, textAlign: "center", color: "#555" },
});
