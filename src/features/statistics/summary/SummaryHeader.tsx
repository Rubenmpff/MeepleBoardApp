import { useEffect, useState } from "react";
import { Image, Keyboard, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Glyph } from "../ui/components";
import { colors, isLarge, type } from "../ui/theme";

// Lavender band behind the status bar with the original logo; Back never takes space from the logo.
export default function SummaryHeader({ backLabel, onBack, topInset = 0 }: { backLabel: string; onBack: () => void; topInset?: number }) {
 const { width, fontScale } = useWindowDimensions();
 const [keyboardOpen, setKeyboardOpen] = useState(false);
 useEffect(() => {
  const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
  const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
  return () => { show.remove(); hide.remove(); };
 }, []);
 const stacked = keyboardOpen || isLarge(width, fontScale);
 const curve = Math.min(width, 680);
 const back = <TouchableOpacity accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={[s.back, !stacked && [s.backFloating, { top: topInset + 9 }]]}>
  <Glyph name="chevron-left" size={24} color={colors.primary} />
  <Text style={[type.body, { color: colors.primary }]}>{backLabel}</Text>
 </TouchableOpacity>;
 return <View style={[s.band, { paddingTop: topInset }]}>
  {stacked && back}
  {!keyboardOpen && <>
   <View pointerEvents="none" style={[s.curve, { left: (width - 100) / 2, transform: [{ scaleX: curve * 1.3 / 100 }] }]} />
   <View style={s.logo} accessible={false}>
    <Image source={require("@/assets/MeepleBoardLogo.png")} style={s.logoImage} resizeMode="contain" />
   </View>
  </>}
  {!stacked && back}
 </View>;
}

const s = StyleSheet.create({
 band: { backgroundColor: colors.band, alignItems: "center", overflow: "hidden" },
 curve: { position: "absolute", bottom: -94, width: 100, height: 100, borderRadius: 50, backgroundColor: colors.background },
 logo: { width: 94, height: 62, overflow: "hidden" },
 logoImage: { width: 162, height: 162, position: "absolute", left: -36, top: -49 },
 back: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 4, paddingRight: 8, alignSelf: "flex-start", marginLeft: 8 },
 backFloating: { position: "absolute", left: 0, marginLeft: 8 },
});
