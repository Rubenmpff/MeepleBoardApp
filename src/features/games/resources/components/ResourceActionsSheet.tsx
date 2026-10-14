import { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, Text, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import Sheet from "@/src/ui/Sheet";
import { Card, Glyph, Note, Row } from "@/src/ui/components";
import { colors, radius, space, type } from "@/src/ui/theme";
import resourceService from "../services/resourceService";
import { apiMessage } from "../utils/apiMessage";
import { GameResource, REPORT_REASONS, ReportReason } from "../types/GameResource";

// «…» on a resource: open the original page or «Reportar problema». Reporting stays in the same sheet:
// a reason, optional details (required for «Outro»), sent to the administrators.
export default function ResourceActionsSheet({ resource, onClose }: { resource: GameResource | null; onClose: () => void }) {
  const { t } = useTranslation("games");
  const [reason, setReason] = useState<ReportReason>("BrokenLink");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<"menu" | "report">("menu");
  useEffect(() => { if (resource) { setReason("BrokenLink"); setComment(""); setStep("menu"); } }, [resource]);
  const needsComment = reason === "Other" && !comment.trim();

  async function send() {
    if (!resource || sending) return;
    if (needsComment) { Alert.alert(t("resources.reportTitle"), t("resources.commentRequired")); return; }
    setSending(true);
    try {
      await resourceService.report(resource.id, reason, comment.trim() || null);
      onClose();
      Alert.alert(t("resources.reported"));
    } catch (error) {
      Alert.alert(t("resources.reportError"), apiMessage(error) ?? "");
    } finally { setSending(false); }
  }

  if (step === "menu") return <Sheet visible={!!resource} title={resource?.title ?? ""} onClose={onClose} closeLabel={t("resources.close")}
    right={{ label: t("resources.close"), onPress: onClose }}>
    <Card>
      <Row first lead={<Glyph name="open-in-new" size={20} color={colors.primary} />} title={t("resources.openIn", { platform: resource?.platform ?? "" })} tone="link"
        onPress={() => { if (resource) void Linking.openURL(resource.url); onClose(); }} />
      <Row lead={<Glyph name="flag-outline" size={20} color={colors.muted} />} title={t("resources.reportTitle")} onPress={() => setStep("report")} />
    </Card>
  </Sheet>;

  return <Sheet visible={!!resource} title={t("resources.reportTitle")} onClose={onClose} closeLabel={t("resources.close")}
    left={{ label: t("resources.back"), back: true, onPress: () => setStep("menu") }} right={{ label: t("resources.send"), bold: true, onPress: () => { void send(); } }}>
    {!!resource && <Note inset>{resource.title}</Note>}
    <Card>
      {REPORT_REASONS.map((key, index) => <Row key={key} first={index === 0} title={t(`resources.reasons.${key}`)} end="check" selected={reason === key} onPress={() => setReason(key)} />)}
    </Card>
    <Text style={[type.body, styles.label]}>{t(reason === "Other" ? "resources.commentRequired" : "resources.comment")}</Text>
    <TextInput style={styles.input} value={comment} onChangeText={setComment} multiline maxLength={500}
      accessibilityLabel={t(reason === "Other" ? "resources.commentRequired" : "resources.comment")} placeholderTextColor={colors.placeholder} />
  </Sheet>;
}

const styles = StyleSheet.create({
  label: { paddingHorizontal: space.lg },
  input: { minHeight: 88, borderRadius: radius.control, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: space.md, fontSize: 15, color: colors.text, textAlignVertical: "top" },
});
