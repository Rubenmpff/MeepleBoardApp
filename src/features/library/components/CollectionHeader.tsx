import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionHeader.tsx

import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";

import { GameLibraryStatus } from "../types/GameLibraryStatus";

type Props = {
  totalCount: number;
  ownedCount: number;
  wishlistCount: number;
  playedCount: number;
  totalSpent: number;
  activeFilter:
  | "ALL"
  | "PLAYED"
  | GameLibraryStatus.Owned
  | GameLibraryStatus.Wishlist;
  onAddPress: () => void;
};

export function CollectionHeader({
  totalCount,
  ownedCount,
  wishlistCount,
  playedCount,
  totalSpent,
  activeFilter,
  onAddPress,
}: Props) {
  const { t: uiT, i18n } = useTranslation("library");
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            {uiT("ui.title")}
          </Text>

          <Text style={styles.subtitle}>
            {uiT("ui.gamesCount", { count: totalCount })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPress}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel={uiT("ui.add")}
        >
          <MaterialIcons
            name="add"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <SummaryItem
          value={ownedCount}
          label={uiT("ui.owned")}
        />

        <View style={styles.divider} />

        <SummaryItem
          value={wishlistCount}
          label={uiT("ui.wanted")}
        />

        <View style={styles.divider} />

        <SummaryItem
          value={playedCount}
          label={uiT("ui.played")}
        />
      </View>

      {activeFilter === GameLibraryStatus.Owned &&
        totalSpent > 0 && (
          <View style={styles.spentRow}>
            <Text style={styles.spentLabel}>
              {uiT("ui.spent")}
            </Text>

            <Text style={styles.spentValue}>
              {new Intl.NumberFormat(i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB", {
                style: "currency",
                currency: "EUR",
              }).format(totalSpent)}
            </Text>
          </View>
        )}
    </View>
  );
}

function SummaryItem({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },

  headerRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  title: { ...UI_STYLES.title },

  subtitle: { ...UI_STYLES.muted, marginTop: 2, fontWeight: "500" },

  addButton: { ...UI_STYLES.iconButton, backgroundColor: COLORS.card, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border },

  summaryRow: {
    ...UI_STYLES.card,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#0B1220",
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryValue: { ...UI_STYLES.section },

  summaryLabel: { ...UI_STYLES.muted, marginTop: 2, fontWeight: "600" },

  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: COLORS.border,
  },

  spentRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  spentLabel: { ...UI_STYLES.muted },

  spentValue: { ...UI_STYLES.caption, fontWeight: "700", color: COLORS.secondary },
});
