import ClubHeader from "@/src/components/ui/ClubHeader";
import { useTranslation } from "react-i18next";
// src/features/library/components/CollectionHeader.tsx

import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";
import { UI_STYLES } from "@/src/styles/clubTheme";

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
      <ClubHeader title={uiT("ui.title")} subtitle={uiT("ui.gamesCount", {count:totalCount})}/>

      <TouchableOpacity style={styles.addAction} onPress={onAddPress} accessibilityRole="button" accessibilityLabel={uiT("ui.add")}>
        <Text style={styles.addLabel}>{uiT("ui.add")}</Text>
        <Text style={styles.addHint}>{uiT("ui.catalogHint")}</Text>
      </TouchableOpacity>

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

      {activeFilter === GameLibraryStatus.Owned && (
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

  addAction: { ...UI_STYLES.button, backgroundColor: COLORS.primary, marginBottom: 12 },
  addLabel: { ...UI_STYLES.body, color: "#FFFFFF", fontWeight: "700" },
  addHint: { ...UI_STYLES.caption, color: "#FFFFFF", textAlign: "center" },

  summaryRow: {
    ...UI_STYLES.card,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#0B1220",
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
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
