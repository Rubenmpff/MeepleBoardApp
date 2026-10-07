import { useTranslation } from "react-i18next";
import ClubHeader from "@/src/components/ui/ClubHeader";
type Props = { username?: string; greeting: string; compact?: boolean };
export default function AppHeader({username,greeting}:Props) {
 const {t}=useTranslation("dashboard");
 return <ClubHeader title={`${greeting}, ${username?.trim() || t("player")}`}/>;
}
