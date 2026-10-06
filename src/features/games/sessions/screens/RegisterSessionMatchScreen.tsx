import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import RegisterMatchForm from "../../matches/components/RegisterMatchForm";
import { RootState } from "@/src/store/store";

export default function RegisterSessionMatchScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  return <SafeAreaView style={{ flex: 1 }}>
    <RegisterMatchForm sessionId={sessionId || "invalid-session"} currentUser={user ?? undefined}
      onRegistered={() => router.dismissTo({ pathname: "/games/sessions/[id]", params: { id: sessionId } })} />
  </SafeAreaView>;
}
