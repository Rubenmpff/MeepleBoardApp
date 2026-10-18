/** Report a published comment: one of five reasons and an optional detail. The author never sees who reported. */
import { useTranslation } from "react-i18next";
import ReasonReportSheet from "@/src/features/friends/components/ReasonReportSheet";
import experienceService from "../services/experienceService";
import { REPORT_REASONS } from "../types/Experience";

export default function ReportSheet({ experienceId, onClose, onReported }: { experienceId: string | null; onClose: () => void; onReported: () => void }) {
  const { t } = useTranslation("games");
  return <ReasonReportSheet visible={!!experienceId} title={t("experiences.reportTitle")} reasons={REPORT_REASONS} label={r => t(`experiences.reasons.${r}`)}
    detailLabel={t("experiences.detail")} note={t("experiences.reportNote")} cancelLabel={t("experiences.cancel")} sendLabel={t("experiences.send")}
    onClose={onClose} onSend={async (reason, detail) => { if (experienceId) { await experienceService.report(experienceId, reason, detail); onReported(); } }} />;
}
