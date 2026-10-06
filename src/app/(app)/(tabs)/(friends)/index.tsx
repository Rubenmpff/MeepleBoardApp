import { Redirect, useLocalSearchParams } from "expo-router";
import { ROUTES } from "@/src/constants/routes";
export default function LegacyRoute() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: ROUTES.FRIENDS, params }} />;
}
