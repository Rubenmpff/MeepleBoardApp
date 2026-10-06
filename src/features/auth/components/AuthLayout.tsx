import { ReactNode } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/navigation/ScreenHeader";
import SectionCard from "@/src/components/ui/SectionCard";
import { APP_THEME } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

type Props = {
  title: string;
  children: ReactNode;
  onBack?: () => void;
  backAccessibilityLabel?: string;
};

export default function AuthLayout({ title, children, onBack, backAccessibilityLabel }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
          {onBack && (
            <View style={styles.header}>
              <ScreenHeader appearance="refresh" title={title} onLeftPress={onBack} leftAccessibilityLabel={backAccessibilityLabel} />
            </View>
          )}
          <SectionCard style={styles.card}>
            <Image source={require("@/assets/MeepleBoardLogo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="MeepleBoard" />
            {!onBack && <Text style={styles.title} accessibilityRole="header">{title}</Text>}
            {children}
          </SectionCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_THEME.colors.background },
  body: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: APP_THEME.space.lg, paddingBottom: APP_THEME.space.xl, gap: APP_THEME.space.lg },
  header: { width: "100%", maxWidth: 520, alignSelf: "center" },
  card: { width: "100%", maxWidth: 520, alignSelf: "center", gap: APP_THEME.space.lg },
  logo: { width: 160, maxWidth: "100%", height: 100, alignSelf: "center" },
  title: { ...UI_STYLES.title, textAlign: "center" },
});
