import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";

import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import RegisterMatchForm from "@/src/features/games/matches/components/RegisterMatchForm";
import gameService from "@/src/features/games/catalog/services/gameService";
import { Game } from "@/src/features/games/catalog/types/Game";
import { RootState } from "@/src/store/store";

// Optional ?gameId= preselects the game (from a game page or the library); without it the form starts empty.
export default function RegisterMatchScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();
  const [initialGame, setInitialGame] = useState<Game | null>(null);
  useEffect(() => {
    if (!gameId) return;
    let active = true;
    gameService.getById(gameId).then(game => { if (active) setInitialGame(game); }).catch(() => { /* the form stays usable without the preselection */ });
    return () => { active = false; };
  }, [gameId]);

  return (
    <SafeAreaView style={styles.container}>
      <RegisterMatchForm initialGame={initialGame} currentUser={user ? { id: user.id, userName: user.userName } : undefined} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
