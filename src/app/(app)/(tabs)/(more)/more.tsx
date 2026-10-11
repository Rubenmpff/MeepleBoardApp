// "Mais" was replaced by Perfil; the old address still works.
import { Redirect, useLocalSearchParams } from "expo-router";
import { ROUTES } from "@/src/constants/routes";
export default function LegacyMore() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: ROUTES.ME, params } as never} />;
}
