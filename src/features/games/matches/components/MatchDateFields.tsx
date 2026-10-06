import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform, useColorScheme, useWindowDimensions, Keyboard } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { withLocalDay, withLocalTime } from "../utils/registrationDate";
import { useState } from "react";

export type MatchDatePickerMode = "date" | "time" | null;

type Props = {
  value: Date;
  onChange: (value: Date) => void;
  picker: MatchDatePickerMode;
  onPickerChange: (mode: MatchDatePickerMode) => void;
  locale: string;
};

// Explicitly pairs native appearance with its own surface, independent of the light app palette.
export function nativePickerPalette(scheme: string | null | undefined) {
  return scheme === "dark"
    ? { theme: "dark" as const, background: "#17232B", text: "#FFFFFF", accent: "#9BC5FF" }
    : { theme: "light" as const, background: "#FFFFFF", text: COLORS.onBackground, accent: COLORS.primary };
}

export default function MatchDateFields({ value, onChange, picker, onPickerChange, locale }: Props) {
  const { t } = useTranslation("matches");
  const palette = nativePickerPalette(useColorScheme());
  const { width, height, fontScale } = useWindowDimensions();
  const calendarFits = width >= 360 && fontScale <= 1.5;
  const dialogHeight = Math.min(height * 0.85, picker === "date" && calendarFits ? 480 : 370);
  const [pendingValue, setPendingValue] = useState(value);
  const open = (mode: "date" | "time") => {
    Keyboard.dismiss(); setPendingValue(value); onPickerChange(mode);
  };
  const select = (chosen: Date) => picker === "date" ? withLocalDay(value, chosen) : withLocalTime(value, chosen);
  const close = () => onPickerChange(null);
  const finish = () => { onChange(select(pendingValue)); close(); };

  return <View style={{ gap: 4 }}>
    <View style={styles.row}>
      <View style={styles.description}>
        <Text style={styles.label}>{t("form.date")}</Text>
        <Text style={styles.value}>{value.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("form.changeDate")} style={styles.change} onPress={() => open("date")}>
        <Text style={styles.changeText}>{t("form.changeDate")}</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.row}>
      <View style={styles.description}>
        <Text style={styles.label}>{t("form.time")}</Text>
        <Text style={styles.value}>{value.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("form.changeTime")} style={styles.change} onPress={() => open("time")}>
        <Text style={styles.changeText}>{t("form.changeTime")}</Text>
      </TouchableOpacity>
    </View>
    {picker && Platform.OS === "ios" && <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={[styles.dialog, { height: dialogHeight, backgroundColor: palette.background }]}>
          <Text style={[styles.dialogTitle, { color: palette.text }]}>{t(picker === "date" ? "form.changeDate" : "form.changeTime")}</Text>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <DateTimePicker value={pendingValue} mode={picker} display={picker === "date" && calendarFits ? "inline" : "spinner"}
              locale={locale} style={{ alignSelf: "stretch", minHeight: picker === "date" && calendarFits ? 320 : 216 }} maximumDate={picker === "date" ? new Date() : undefined}
              themeVariant={palette.theme} textColor={palette.text} accentColor={palette.accent}
              onChange={(_event, chosen) => { if (chosen) setPendingValue(chosen); }} />
          </ScrollView>
          <View style={styles.dialogActions}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("form.cancel")} style={styles.dialogButton} onPress={close}>
              <Text style={[styles.changeText, { color: palette.accent }]}>{t("form.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("form.done")} style={styles.dialogButton} onPress={finish}>
              <Text style={[styles.changeText, { color: palette.accent }]}>{t("form.done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>}
    {picker && Platform.OS !== "ios" && <DateTimePicker value={value} mode={picker} display="default"
      maximumDate={picker === "date" ? new Date() : undefined}
      onChange={(event, chosen) => { if (event.type === "set" && chosen) onChange(select(chosen)); close(); }} />}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, paddingVertical: 4 },
  description: { flexGrow: 1, flexShrink: 1, minWidth: 130 },
  label: { ...UI_STYLES.caption, color: COLORS.textMuted },
  value: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.onBackground },
  change: { ...UI_STYLES.control, paddingHorizontal: 10, alignItems: "center" },
  changeText: { ...UI_STYLES.body, fontWeight: "700", color: COLORS.primary, flexShrink: 1 },
  backdrop: { flex: 1, justifyContent: "center", alignItems: "center", padding: 12, backgroundColor: "rgba(0,0,0,0.55)" },
  dialog: { width: "100%", maxWidth: 420, borderRadius: 16, padding: 12, gap: 8 },
  dialogTitle: { ...UI_STYLES.section },
  dialogActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
  dialogButton: { ...UI_STYLES.control, paddingHorizontal: 16, alignItems: "center" },
});
