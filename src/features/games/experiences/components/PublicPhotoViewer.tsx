/**
 * A photo published in the community, opened larger. Anyone who sees it can report it, except its author; the
 * report goes to moderation and, with enough people, hides it from the community until reviewed.
 */
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Sheet from "@/src/ui/Sheet";
import { Glyph } from "@/src/ui/components";
import { colors, space, touch, type } from "@/src/ui/theme";
import JournalPhoto from "@/src/features/games/journal/components/JournalPhoto";
import ReasonReportSheet from "@/src/features/friends/components/ReasonReportSheet";
import communityService from "@/src/features/friends/services/communityService";
import { PHOTO_REPORT_REASONS } from "@/src/features/friends/types/Community";

export type ViewedPhoto = { url: string; name: string; mine: boolean };

export default function PublicPhotoViewer({ photo, reporting, onView, onReport, onReported }: {
  photo: ViewedPhoto | null; reporting: string | null; onView: (photo: ViewedPhoto | null) => void; onReport: (url: string | null) => void; onReported: () => void;
}) {
  const { t } = useTranslation("matches");
  return <>
    <Sheet visible={!!photo} title={photo ? (photo.mine ? t("gallery.viewerMine") : t("photos.viewerOf", { name: photo.name })) : t("photos.viewer")}
      onClose={() => onView(null)} closeLabel={t("photos.close")} left={{ label: t("photos.close"), onPress: () => onView(null) }}>
      <View style={{ gap: space.md }}>
        {photo && <JournalPhoto uri={photo.url} style={styles.large} />}
        {photo && !photo.mine && <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("photos.report")} style={styles.report}
          onPress={() => { onReport(photo.url); onView(null); }}>
          <Glyph name="flag-outline" size={20} color={colors.danger} />
          <Text style={[type.body, { color: colors.danger }]}>{t("photos.report")}</Text>
        </TouchableOpacity>}
      </View>
    </Sheet>
    <ReasonReportSheet visible={!!reporting} title={t("photos.reportTitle")} reasons={PHOTO_REPORT_REASONS} label={r => t(`photos.reasons.${r}`)}
      detailLabel={t("photos.reportDetail")} note={t("photos.publicReportNote")} cancelLabel={t("photos.cancel")} sendLabel={t("photos.send")}
      onClose={() => onReport(null)}
      onSend={async (reason, detail) => {
        if (!reporting) return;
        await communityService.reportPhoto(reporting, reason, detail);
        onReport(null); Alert.alert(t("photos.reportTitle"), t("photos.reported")); onReported();
      }} />
  </>;
}

const styles = StyleSheet.create({
  large: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: colors.line },
  report: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch },
});
