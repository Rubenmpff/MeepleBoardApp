import { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Glyph } from "./components";
import { colors, radius, space, strong, touch, type } from "./theme";

export type SheetAction = { label: string; onPress: () => void; accessibilityLabel?: string; back?: boolean; bold?: boolean; disabled?: boolean };

// Bottom sheet over the statistics: it never pushes or changes the page below.
// minHeight keeps a searchable sheet steady while results are filtered.
export default function Sheet({ visible, title, onClose, closeLabel, left, right, minHeight, children }: { visible: boolean; title: string; onClose: () => void; closeLabel: string; left?: SheetAction; right?: SheetAction; minHeight?: number; children: ReactNode }) {
 const action = (a: SheetAction | undefined, align: "flex-start" | "flex-end") => <View style={[s.side, { alignItems: align }]}>
  {a && <TouchableOpacity style={[s.action, a.disabled && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel={a.accessibilityLabel ?? a.label} accessibilityState={{ disabled: !!a.disabled }} disabled={a.disabled} onPress={a.onPress}>
   {a.back && <Glyph name="chevron-left" size={24} color={colors.primary} />}
   <Text style={[type.body, { color: colors.primary }, a.bold && strong]}>{a.label}</Text>
  </TouchableOpacity>}
 </View>;
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
  <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
   <TouchableOpacity style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} />
   <SafeAreaView edges={["bottom", "left", "right"]} style={[s.sheet, minHeight != null && { minHeight }]}>
    <View accessibilityViewIsModal style={s.inner}>
     <View style={s.grab} />
     <View style={s.head}>
      {action(left, "flex-start")}
      <Text style={[type.head, s.title]} accessibilityRole="header" numberOfLines={2}>{title}</Text>
      {action(right, "flex-end")}
     </View>
     <ScrollView style={s.scroll} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}</ScrollView>
    </View>
   </SafeAreaView>
  </KeyboardAvoidingView>
 </Modal>;
}

const s = StyleSheet.create({
 root: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.scrim },
 sheet: { maxHeight: "88%", backgroundColor: colors.background, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderCurve: "continuous", overflow: "hidden" },
 inner: { flexShrink: 1, paddingTop: 6 },
 grab: { width: 36, height: 5, borderRadius: 3, backgroundColor: "#D6D1DC", alignSelf: "center" },
 head: { flexDirection: "row", alignItems: "center", minHeight: touch, paddingHorizontal: space.sm, marginTop: 2 },
 side: { flex: 1, minWidth: 0 },
 action: { minHeight: touch, minWidth: touch, flexDirection: "row", alignItems: "center", paddingHorizontal: space.sm },
 title: { flexShrink: 1, maxWidth: "50%", textAlign: "center" },
 scroll: { flexGrow: 0 },
 body: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.lg, gap: space.lg },
});
