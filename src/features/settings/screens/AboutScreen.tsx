/**
 * Sobre e créditos: the app version, where game data comes from (with the official «Powered by BGG» logo, linked
 * to BoardGameGeek) and how the three ratings differ. Static: nothing here is loaded or calculated.
 */
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/components/ui/ScreenLayout";
import { Card, Glyph, Row, Section } from "@/src/ui/components";
import PoweredByBgg from "@/src/ui/PoweredByBgg";
import { colors, space, touch, type } from "@/src/ui/theme";

const BGG = "https://boardgamegeek.com";

export default function AboutScreen() {
  const { t } = useTranslation("settings");
  const open = () => { void Linking.openURL(BGG); };
  const version = Constants.expoConfig?.version;
  const dot = (color: string) => <View style={[styles.dot, { backgroundColor: color }]} />;
  return (
    <ScreenLayout title={t("about.title")}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Card>
          <Row first inset={52} lead={<Glyph name="dice-5" size={24} color={colors.icon} />} strongTitle title="MeepleBoard"
            subtitle={version ? t("about.version", { version }) : undefined} />
        </Card>

        <Section title={t("about.dataTitle")}>
          <Card padded>
            <View style={styles.data}>
              <TouchableOpacity style={styles.logo} onPress={open} accessibilityRole="link" accessibilityLabel={t("about.logo")} accessibilityHint={t("about.openHint")}>
                <PoweredByBgg height={52} />
              </TouchableOpacity>
              <Text style={type.body}>{t("about.data")}</Text>
              <Text style={type.caption}>{t("about.dataNote")}</Text>
            </View>
          </Card>
        </Section>

        <Section title={t("about.ratingsTitle")}>
          <Card>
            <Row first inset={40} lead={dot(colors.text)} strongTitle title={t("about.bgg")} subtitle={t("about.bggHint")} />
            <Row inset={40} lead={dot(colors.primary)} strongTitle title={t("about.meepleBoard")} subtitle={t("about.meepleBoardHint")} />
            <Row inset={40} lead={dot(colors.gold)} strongTitle title={t("about.mine")} subtitle={t("about.mineHint")} />
          </Card>
        </Section>

        <Card>
          <Row first inset={52} lead={<Glyph name="open-in-new" size={20} color={colors.primary} />} title={t("about.open")} subtitle="boardgamegeek.com"
            tone="link" end="none" accessibilityHint={t("about.openHint")} onPress={open} />
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: space.lg, paddingTop: space.xs, paddingBottom: 32, gap: space.xl },
  data: { gap: space.md },
  logo: { alignSelf: "flex-start", minHeight: touch, justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
