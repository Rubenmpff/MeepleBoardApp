import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { FocusEvent, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AuthPlayfulDetails from "./AuthPlayfulDetails";
import { StatusBar } from "expo-status-bar";
import { AUTH_COLORS as colors } from "../styles/authTheme";

type FocusTarget = FocusEvent["target"];
const FocusContext = createContext<(target: FocusTarget) => void>(() => {});
export const useAuthFieldFocus = () => useContext(FocusContext);

type Props = { title: string; children: ReactNode; onBack?: () => void; backAccessibilityLabel?: string; subtitle?: string; cancelForm?: boolean };

export default function AuthLayout({ title, children, onBack, backAccessibilityLabel, subtitle, cancelForm = false }: Props) {
  const { t } = useTranslation("navigation");
  const { width, height, fontScale } = useWindowDimensions();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const focused = useRef<FocusTarget | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compact = keyboardOpen || height < 700 || fontScale >= 1.4;
  const stackedHeader = Math.min(width, 520) - 40 < 104 + 2 * (100 * fontScale + 8);
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
              <View testID="authentication-header" style={[styles.navigation, !keyboardOpen && styles.fullNavigation, !keyboardOpen && stackedHeader && onBack && styles.stackedNavigation]}>
                {!keyboardOpen && <View testID="authentication-logo" style={[styles.logoPosition, stackedHeader && styles.stackedLogo]}>
                  <View style={styles.logoViewport}>
                    <Image source={require("@/assets/MeepleBoardLogo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="MeepleBoard" />
                  </View>
                </View>}
                <View testID="authentication-controls" style={styles.controls}>
                  {onBack ? <TouchableOpacity style={styles.back} onPress={onBack} accessibilityRole="button" accessibilityLabel={cancelForm ? t("cancel") : backAccessibilityLabel ?? t("back")}>
                    <Feather name="chevron-left" size={20} color={colors.primary} />
                    <Text style={styles.backText}>{t(cancelForm ? "cancel" : "back")}</Text>
                  </TouchableOpacity> : <View />}
                  {!compact && <AuthPlayfulDetails />}
                </View>
              </View>
              <View style={styles.headingRow}>
                <View style={styles.heading}>
                  <Text style={styles.title} accessibilityRole="header">{title}</Text>
                  {!!subtitle && !keyboardOpen && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>

              </View>
              {!compact && <View testID="auth-header-curve" pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                style={[styles.curve, { left: Math.min(width, 520) / 2 - 50, transform: [{ scaleX: Math.min(width, 520) * 1.3 / 100 }] }]} />}
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
  hero: { backgroundColor: colors.hero, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, overflow: "hidden" },
  compactHero: { paddingTop: 4, paddingBottom: 10 },
  navigation: { marginBottom: 6 },
  fullNavigation: { minHeight: 68, justifyContent: "center" },
  stackedNavigation: { paddingTop: 68 },
  // Center against the full header width, independently of either side control.
  logoPosition: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  stackedLogo: { top: 0 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  back: { minHeight: 44, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  backText: { fontSize: 16, lineHeight: 24, color: colors.primary, fontWeight: "600", flexShrink: 1 },
  // The original square PNG has transparent margins. Crop its display viewport, not the asset.
  logoViewport: { width: 104, height: 68, overflow: "hidden" },
  logo: { position: "absolute", width: 180, height: 180, left: -40, top: -54 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12 }, heading: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 22, lineHeight: 30, color: colors.text, fontWeight: "700" },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.muted },
  curve: { position: "absolute", bottom: -90, width: 100, height: 100, borderRadius: 50, backgroundColor: colors.background },
  form: { paddingHorizontal: 20, paddingTop: 14, gap: 14 },
});
