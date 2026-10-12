import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import Sheet from "@/src/ui/Sheet";
import { Card, Note, Row } from "@/src/ui/components";
import { colors, radius, space, type } from "@/src/ui/theme";
import resourceService from "../services/resourceService";
import { apiMessage } from "../utils/apiMessage";
import { GameResource, REPORT_REASONS, ReportReason } from "../types/GameResource";

// «Reportar problema»: a reason, optional details (required for «Outro»), sent to the administrators.
export default function ReportResourceSheet({ resource, onClose }: { resource: GameResource | null; onClose: () => void }) {
  const { t } = useTranslation("games");
  const [reason, setReason] = useState<ReportReason>("BrokenLink");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => { if (resource) { setReason("BrokenLink"); setComment(""); } }, [resource]);
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

  return <Sheet visible={!!resource} title={t("resources.reportTitle")} onClose={onClose} closeLabel={t("resources.close")}
    left={{ label: t("resources.cancel"), onPress: onClose }} right={{ label: t("resources.send"), bold: true, onPress: () => { void send(); } }}>
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
