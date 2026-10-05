// src/features/library/components/CollectionHeader.tsx

import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { COLORS } from "@/src/constants/colors";

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
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            Minha coleção
          </Text>

          <Text style={styles.subtitle}>
            {totalCount} jogo
            {totalCount === 1 ? "" : "s"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPress}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel="Adicionar jogo"
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
          label="Tenho"
        />

        <View style={styles.divider} />

        <SummaryItem
          value={wishlistCount}
          label="Quero"
        />

        <View style={styles.divider} />

        <SummaryItem
          value={playedCount}
          label="Jogados"
        />
      </View>

      {activeFilter === GameLibraryStatus.Owned &&
        totalSpent > 0 && (
          <View style={styles.spentRow}>
            <Text style={styles.spentLabel}>
              Valor registado
            </Text>

            <Text style={styles.spentValue}>
              {new Intl.NumberFormat("pt-PT", {
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

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textMuted,
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  summaryRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#0B1220",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.onBackground,
  },

  summaryLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textMuted,
  },

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

  spentLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  spentValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.secondary,
  },
});