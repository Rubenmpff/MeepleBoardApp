import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Sheet from "@/src/ui/Sheet";
import { Card, Glyph, Icon, Row } from "@/src/ui/components";
import { colors } from "@/src/ui/theme";
import { ROUTES } from "@/src/constants/routes";

// The ＋ tab: every way of starting something new, recording a match first.
export default function NewSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation("navigation");
  const router = useRouter();
  const items: { key: string; icon: Icon; route: string; primary?: boolean }[] = [
    { key: "registerMatch", icon: "dice-5", route: ROUTES.REGISTER_MATCH, primary: true },
    { key: "newSession", icon: "calendar-star", route: ROUTES.SESSION_CREATE },
    { key: "addGame", icon: "bookshelf", route: ROUTES.SEARCH_GAMES },
    { key: "newCampaign", icon: "sword-cross", route: ROUTES.CAMPAIGN_CREATE },
  ];
  return <Sheet visible={visible} title={t("newSheet.title")} closeLabel={t("newSheet.close")} onClose={onClose} right={{ label: t("newSheet.close"), onPress: onClose }}>
    <Card>
      {items.map((item, index) => <Row key={item.key} first={index === 0} inset={72} strongTitle title={t(`newSheet.${item.key}`)} subtitle={t(`newSheet.${item.key}Hint`)}
        lead={<View style={[styles.icon, item.primary && styles.primary]}><Glyph name={item.icon} size={22} color={item.primary ? colors.onPrimary : colors.primary} /></View>}
        onPress={() => { onClose(); router.push(item.route as never); }} />)}
    </Card>
  </Sheet>;
}

const styles = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: colors.primary },
});
