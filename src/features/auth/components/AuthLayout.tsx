import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { FocusEvent, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import LottieView from "lottie-react-native";
import { StatusBar } from "expo-status-bar";
import { AUTH_COLORS as colors } from "../styles/authTheme";

type FocusTarget = FocusEvent["target"];
const FocusContext = createContext<(target: FocusTarget) => void>(() => {});
export const useAuthFieldFocus = () => useContext(FocusContext);

type Props = { title: string; children: ReactNode; onBack?: () => void; backAccessibilityLabel?: string; subtitle?: string };

export default function AuthLayout({ title, children, onBack, backAccessibilityLabel, subtitle }: Props) {
  const { t } = useTranslation("navigation");
  const { height, fontScale } = useWindowDimensions();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const focused = useRef<FocusTarget | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compact = keyboardOpen || height < 700 || fontScale >= 1.4;
  function revealField(target: FocusTarget) {
    focused.current = target;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      scroll.current?.scrollResponderScrollNativeHandleToKeyboard?.(target, 24, true);
    }, 250);
  }
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardOpen(true));
    const shown = Keyboard.addListener("keyboardDidShow", () => { if (focused.current != null) revealField(focused.current); });
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardOpen(false));
    return () => { show.remove(); shown.remove(); hide.remove(); if (timer.current) clearTimeout(timer.current); };
  }, []);
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="never" contentContainerStyle={styles.content}>
          <View style={styles.page}>
            <View style={[styles.hero, compact && styles.compactHero]}>
              <View style={styles.navigation}>
                {onBack && <TouchableOpacity style={styles.back} onPress={onBack} accessibilityRole="button" accessibilityLabel={backAccessibilityLabel ?? t("cancel")}>
                  <Feather name="chevron-left" size={20} color={colors.primary} />
                  <Text style={styles.backText}>{t("cancel")}</Text>
                </TouchableOpacity>}
                <View style={styles.logoViewport}>
                  <Image source={require("@/assets/MeepleBoardLogo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="MeepleBoard" />
                </View>
              </View>
              <View style={styles.headingRow}>
                <View style={styles.heading}>
                  <Text style={styles.title} accessibilityRole="header">{title}</Text>
                  {!!subtitle && !keyboardOpen && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {!compact && <View style={styles.mascot} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <View style={styles.token} />
                  <LottieView source={require("@/assets/animations/ghost.json")} progress={0} autoPlay={false} loop={false} style={styles.ghost} />
                </View>}
              </View>
            </View>
            <FocusContext.Provider value={revealField}>
              <View style={styles.form}>{children}</View>
            </FocusContext.Provider>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, body: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 24 }, page: { width: "100%", maxWidth: 520, alignSelf: "center" },
  hero: { backgroundColor: colors.hero, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, borderBottomRightRadius: 32 },
  compactHero: { paddingBottom: 12 },
  navigation: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  back: { minHeight: 44, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  backText: { fontSize: 16, lineHeight: 24, color: colors.primary, fontWeight: "600", flexShrink: 1 },
  // The original square PNG has transparent margins. Crop its display viewport, not the asset.
  logoViewport: { width: 132, height: 88, overflow: "hidden" },
  logo: { position: "absolute", width: 230, height: 230, left: -50, top: -68 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12 }, heading: { flex: 1, minWidth: 0, gap: 8 },
  title: { fontSize: 26, lineHeight: 34, color: colors.text, fontWeight: "800" },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.muted },
  mascot: { width: 78, height: 116, overflow: "hidden" },
  ghost: { position: "absolute", width: 240, height: 240, left: -81, top: -64 },
  token: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: "#BCD7C8", top: 4, right: 0 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
});
