import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import RegisterMatchForm from "../../matches/components/RegisterMatchForm";
import gameService from "@/src/features/games/catalog/services/gameService";
import { Game } from "@/src/features/games/catalog/types/Game";
import { RootState } from "@/src/store/store";

// ?gameId= is the session's planned game: chosen at first, changeable. The match stays in the session whatever game it is.
export default function RegisterSessionMatchScreen() {
  const { sessionId, gameId } = useLocalSearchParams<{ sessionId: string; gameId?: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const [initialGame, setInitialGame] = useState<Game | null>(null);
  useEffect(() => {
    if (!gameId) return;
    let active = true;
    gameService.getById(gameId).then(game => { if (active) setInitialGame(game); }).catch(() => { /* the form stays usable without the preselection */ });
    return () => { active = false; };
  }, [gameId]);
  return <SafeAreaView style={{ flex: 1 }}>
    <RegisterMatchForm sessionId={sessionId || "invalid-session"} currentUser={user ?? undefined} initialGame={initialGame}
      onRegistered={() => router.dismissTo({ pathname: "/games/sessions/[id]", params: { id: sessionId } })} />
  </SafeAreaView>;
}
