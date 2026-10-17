import { useTranslation } from "react-i18next";
import { Glyph } from "@/src/ui/components";
// src/features/library/components/CollectionEmptyState.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { UI_COLORS as COLORS } from "@/src/styles/clubTheme";
import { UI_STYLES } from "@/src/styles/clubTheme";
import PrimaryButton from "@/src/ui/PrimaryButton";

type Variant = "collection" | "wishlist" | "played" | "search" | "all" | "filters";

type Props = {
  variant: Variant;
  onActionPress?: () => void;
};

const CONTENT: Record<Variant, { icon: string; title: string; subtitle: string; action?: string }> = {
  collection: {
    icon: "cards-outline",
    title: "emptyCollection",
    subtitle: "emptyCollectionDescription",
    action: "addFirst",
  },
  wishlist: {
    icon: "heart-outline",
    title: "emptyWishlist",
    subtitle: "emptyWishlistDescription",
    action: "explore",
  },
  played: {
    icon: "controller-classic-outline",
    title: "emptyPlayed",
    subtitle: "emptyPlayedDescription",
  },
  all: {
    icon: "cards-outline",
    title: "emptyCollection",
    subtitle: "emptyCollectionDescription",
    action: "addFirst",
  },
  search: {
    icon: "magnify",
    title: "emptySearch",
    subtitle: "",
    action: "clearSearch",
  },
  filters: {
    icon: "tune-variant",
    title: "emptyFilters",
    subtitle: "",
    action: "clearFilters",
  },
};

export function CollectionEmptyState({ variant, onActionPress }: Props) {
  const { t: uiT } = useTranslation("library");
  const content = CONTENT[variant];

  return (
    <View style={styles.wrap}>
      <View style={{ alignSelf: "center" }}><Glyph name={content.icon as any} size={44} color={COLORS.textMuted} /></View>
      <Text style={styles.title}>{uiT(`ui.${content.title}`)}
      </Text>
      {!!content.subtitle && <Text style={styles.subtitle}>{uiT(`ui.${content.subtitle}`)}
      </Text>}
      {content.action && onActionPress && (
        <PrimaryButton title={uiT(`ui.${content.action}`)} onPress={onActionPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "stretch", paddingVertical: 32, paddingHorizontal: 16, gap: 16 },
  title: { ...UI_STYLES.section, textAlign: "center", marginTop: 4 },
  subtitle: { ...UI_STYLES.empty },
});
