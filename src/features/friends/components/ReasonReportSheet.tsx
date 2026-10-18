/** A report: one reason from a short list and an optional detail. Whoever is reported never sees who reported. */
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Sheet from "@/src/ui/Sheet";
import { colors, radius, space, touch, type } from "@/src/ui/theme";

export type ReasonReportSheetProps<R extends string> = {
  visible: boolean; title: string; reasons: R[]; label: (reason: R) => string; detailLabel: string; note: string;
  cancelLabel: string; sendLabel: string; onClose: () => void; onSend: (reason: R, detail: string) => Promise<void>;
};

export default function ReasonReportSheet<R extends string>({ visible, title, reasons, label, detailLabel, note, cancelLabel, sendLabel, onClose, onSend }: ReasonReportSheetProps<R>) {
  const [reason, setReason] = useState<R | null>(null);
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!reason || sending) return;
    setSending(true);
    try { await onSend(reason, detail); setReason(null); setDetail(""); }
    catch (err: any) { Alert.alert(title, err?.message); }
    finally { setSending(false); }
  };
  return <Sheet visible={visible} title={title} onClose={onClose} closeLabel={cancelLabel}
    left={{ label: cancelLabel, onPress: onClose }} right={{ label: sendLabel, onPress: send, bold: true, disabled: !reason || sending }}>
    <View style={{ gap: space.xs }}>
      {reasons.map(r => <TouchableOpacity key={r} style={styles.option} accessibilityRole="radio" accessibilityState={{ selected: reason === r }} onPress={() => setReason(r)}>
        <View style={[styles.radio, reason === r && styles.radioOn]}>{reason === r && <View style={styles.dot} />}</View>
        <Text style={type.body}>{label(r)}</Text>
      </TouchableOpacity>)}
      <TextInput style={styles.input} value={detail} onChangeText={v => setDetail(v.slice(0, 300))} placeholder={detailLabel} placeholderTextColor={colors.placeholder}
        multiline maxLength={300} accessibilityLabel={detailLabel} />
      <Text style={type.caption}>{note}</Text>
    </View>
  </Sheet>;
}

const styles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: touch + 4, borderBottomWidth: 1, borderBottomColor: colors.hair },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.empty, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  input: { minHeight: 64, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background, padding: space.md, marginTop: space.sm, ...type.body },
});
