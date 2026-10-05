import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

interface StarRatingProps {
  value?: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  showLabel?: boolean;
}

const STAR_COLOR = "#F9A825";
const STAR_EMPTY = "#E0E0E0";

function Star({
  index,
  value,
  size,
  onChange,
  readonly,
  halfAccessibilityLabel,
  fullAccessibilityLabel,
}: {
  index: number;
  value: number;
  size: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  halfAccessibilityLabel: string;
  fullAccessibilityLabel: string;
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
    <View style={{ width: size, height: size, position: "relative" }}>
      <Text
        style={[
          styles.starBase,
          {
            fontSize: size,
            color: full ? STAR_COLOR : STAR_EMPTY,
          },
        ]}
      >
        ★
      </Text>

      {half && (
        <View style={[styles.halfClip, { width: size / 2 }]}>
          <Text
            style={[
              styles.starBase,
              { fontSize: size, color: STAR_COLOR },
            ]}
          >
            ★
          </Text>
        </View>
      )}

      {!readonly && (
        <>
          <TouchableOpacity
            style={[
              styles.touchHalf,
              { width: size / 2, height: size, left: 0 },
            ]}
            onPress={setHalf}
            accessibilityRole="button"
            accessibilityLabel={halfAccessibilityLabel}
          />
          <TouchableOpacity
            style={[
              styles.touchHalf,
              { width: size / 2, height: size, right: 0 },
            ]}
            onPress={setFull}
            accessibilityRole="button"
            accessibilityLabel={fullAccessibilityLabel}
          />
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
}: StarRatingProps) {
  const { t } = useTranslation("games");
  const current = value ?? 0;

  function getRatingLabel(rating: number): string {
    if (rating === 0) return t("rating.none");
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
      <View style={styles.starsRow}>
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

      {showLabel && current > 0 && (
        <View style={styles.labelRow}>
          <Text style={styles.labelValue}>
            {current.toFixed(1)}/10
          </Text>
          <Text style={styles.labelText}>
            {getRatingLabel(current)}
          </Text>
        </View>
      )}

      {showLabel && current === 0 && !readonly && (
        <Text style={styles.labelEmpty}>{t("rating.tapToRate")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-start" },
  starsRow: { flexDirection: "row", gap: 4 },
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
    color: STAR_COLOR,
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
