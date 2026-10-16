/** Report a published comment: one of five reasons and an optional detail. The author never sees who reported. */
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Sheet from "@/src/ui/Sheet";
import { colors, radius, space, touch, type } from "@/src/ui/theme";
import experienceService from "../services/experienceService";
import { REPORT_REASONS, ReportReason } from "../types/Experience";

export default function ReportSheet({ experienceId, onClose, onReported }: { experienceId: string | null; onClose: () => void; onReported: () => void }) {
  const { t } = useTranslation("games");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!experienceId || !reason || sending) return;
    setSending(true);
    try { await experienceService.report(experienceId, reason, detail); setReason(null); setDetail(""); onReported(); }
    catch (err: any) { Alert.alert(t("experiences.reportTitle"), err?.message); }
    finally { setSending(false); }
  };
  return <Sheet visible={!!experienceId} title={t("experiences.reportTitle")} onClose={onClose} closeLabel={t("experiences.cancel")}
    left={{ label: t("experiences.cancel"), onPress: onClose }} right={{ label: t("experiences.send"), onPress: send, bold: true, disabled: !reason || sending }}>
    <View style={{ gap: space.xs }}>
      {REPORT_REASONS.map(r => <TouchableOpacity key={r} style={styles.option} accessibilityRole="radio" accessibilityState={{ selected: reason === r }} onPress={() => setReason(r)}>
        <View style={[styles.radio, reason === r && styles.radioOn]}>{reason === r && <View style={styles.dot} />}</View>
        <Text style={type.body}>{t(`experiences.reasons.${r}`)}</Text>
      </TouchableOpacity>)}
      <TextInput style={styles.input} value={detail} onChangeText={v => setDetail(v.slice(0, 300))} placeholder={t("experiences.detail")} placeholderTextColor={colors.placeholder}
        multiline maxLength={300} accessibilityLabel={t("experiences.detail")} />
      <Text style={type.caption}>{t("experiences.reportNote")}</Text>
    </View>
  </Sheet>;
}

const styles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: touch + 4, borderBottomWidth: 1, borderBottomColor: colors.hair },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#B9B3C0", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  input: { minHeight: 64, borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, backgroundColor: colors.background, padding: space.md, marginTop: space.sm, ...type.body },
});
