import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { UI_COLORS, APP_THEME, RATING_COLORS } from "@/src/styles/appTheme";

interface StarRatingProps {
  value?: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  showLabel?: boolean;
  appearance?: "default" | "refresh";
}

const STAR_COLOR = RATING_COLORS.gold;
const STAR_EMPTY = RATING_COLORS.empty;

function Star({
  index,
  value,
  size,
  onChange,
  readonly,
  halfAccessibilityLabel,
  fullAccessibilityLabel,
  refresh,
}: {
  index: number;
  value: number;
  size: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  halfAccessibilityLabel: string;
  fullAccessibilityLabel: string;
  refresh?: boolean;
}) {
  const full = value >= index;
  const half = !full && value >= index - 0.5;

  function setHalf() {
    if (readonly || !onChange) return;
    const next = index - 0.5;
    onChange(value === next ? 0 : next);
  }

  function setFull() {
    if (readonly || !onChange) return;
    const next = index;
    onChange(value === next ? 0 : next);
  }

  return (
    <View style={{ width: refresh ? 100 : size, height: refresh ? 64 : size, position: "relative" }}>
      <Text
        allowFontScaling={!refresh}
        style={[
          styles.starBase,
          {
            fontSize: size,
            color: full ? STAR_COLOR : STAR_EMPTY,
            ...(refresh ? { position: "absolute", left: (100 - size) / 2 } as const : {}),
          },
        ]}
      >
        {full ? "★" : "☆"}
      </Text>

      {half && (
        <View style={[styles.halfClip, { width: size / 2, left: refresh ? (100 - size) / 2 : 0 }]}>
          <Text
            allowFontScaling={!refresh}
            style={[
              styles.starBase,
              { fontSize: size, color: STAR_COLOR },
            ]}
          >
            ★
          </Text>
        </View>
      )}

      {(full || half) && <Text allowFontScaling={!refresh} style={{ position: "absolute", top: 0,
        left: refresh ? (100 - size) / 2 : 0, fontSize: size, color: RATING_COLORS.outline }}>☆</Text>}

      {!readonly && (
        <>
          <TouchableOpacity
            style={[
              styles.touchHalf,
              { width: refresh ? 50 : size / 2, height: refresh ? 64 : size, left: 0 },
            ]}
            onPress={setHalf}
            accessibilityRole="button"
            accessibilityLabel={halfAccessibilityLabel}
          >
            {refresh && <Text style={styles.choice}>{index - 0.5}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.touchHalf,
              { width: refresh ? 50 : size / 2, height: refresh ? 64 : size, right: 0 },
            ]}
            onPress={setFull}
            accessibilityRole="button"
            accessibilityLabel={fullAccessibilityLabel}
          >
            {refresh && <Text style={styles.choice}>{index}</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 32,
  showLabel = true,
  appearance = "default",
}: StarRatingProps) {
  const { t } = useTranslation("games");
  const current = value ?? 0;
  const refresh = appearance === "refresh" && !readonly;

  function getRatingLabel(rating: number): string {
    if (rating === 0) return t("rating.zero");
    if (rating <= 1) return t("rating.terrible");
    if (rating <= 2) return t("rating.veryWeak");
    if (rating <= 3) return t("rating.weak");
    if (rating <= 4) return t("rating.belowExpected");
    if (rating <= 5) return t("rating.ok");
    if (rating <= 6) return t("rating.fair");
    if (rating <= 7) return t("rating.good");
    if (rating <= 8) return t("rating.veryGood");
    if (rating <= 9) return t("rating.excellent");
    return t("rating.masterpiece");
  }

  return (
    <View style={styles.container}>
      <View style={[styles.starsRow, appearance === "refresh" && { flexWrap: "wrap" }, refresh && styles.refreshRow]}>
        {Array.from({ length: 10 }, (_, index) => {
          const star = index + 1;

          return (
            <Star
              key={star}
              index={star}
              value={current}
              size={size}
              onChange={onChange}
              readonly={readonly}
              refresh={refresh}
              halfAccessibilityLabel={t(
                "rating.setHalfAccessibility",
                { value: star - 0.5 }
              )}
              fullAccessibilityLabel={t(
                "rating.setFullAccessibility",
                { value: star }
              )}
            />
          );
        })}
      </View>

      {showLabel && value != null && (
        <View style={styles.labelRow}>
          <Text style={[styles.labelValue, refresh && { color: UI_COLORS.onBackground }]}>
            {current.toFixed(1)}/10
          </Text>
          <Text style={styles.labelText}>
            {getRatingLabel(current)}
          </Text>
        </View>
      )}

      {showLabel && value == null && !readonly && (
        <Text style={[styles.labelEmpty, refresh && { ...APP_THEME.text.caption, color: UI_COLORS.textMuted }]}>{t("rating.tapToRate")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-start" },
  starsRow: { flexDirection: "row", gap: 4 },
  refreshRow: { flexWrap: "wrap", gap: 8 },
  choice: { ...APP_THEME.text.caption, position: "absolute", bottom: 0, alignSelf: "center", color: UI_COLORS.textMuted },
  starBase: { lineHeight: undefined },
  halfClip: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  touchHalf: { position: "absolute", top: 0 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  labelValue: {
    fontSize: 15,
    fontWeight: "800",
    color: UI_COLORS.onBackground,
  },
  labelText: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "600",
  },
  labelEmpty: {
    fontSize: 12,
    color: "#BBBBBB",
    marginTop: 6,
  },
});
