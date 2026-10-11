// The personal profile now lives in the Perfil tab; the old address still works.
import { Redirect, useLocalSearchParams } from "expo-router";
import { ROUTES } from "@/src/constants/routes";
export default function LegacyProfile() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: ROUTES.ME, params } as never} />;
}
