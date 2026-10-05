// src/features/library/components/CollectionEmptyState.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/colors";

type Variant = "collection" | "wishlist" | "played" | "search" | "all" | "filters";

type Props = {
  variant: Variant;
  onActionPress?: () => void;
};

const CONTENT: Record<Variant, { icon: string; title: string; subtitle: string; action?: string }> = {
  collection: {
    icon: "albums-outline",
    title: "A tua coleção está vazia",
    subtitle: "Pesquisa os teus jogos favoritos no BoardGameGeek e começa a criar a tua biblioteca.",
    action: "Adicionar primeiro jogo",
  },
  wishlist: {
    icon: "heart-outline",
    title: "Ainda não tens jogos na wishlist",
    subtitle: "Guarda jogos que gostarias de comprar ou experimentar no futuro.",
    action: "Explorar jogos",
  },
  played: {
    icon: "game-controller-outline",
    title: "Ainda não jogaste nenhum jogo",
    subtitle: "Regista uma partida para começares a construir o teu histórico.",
  },
  all: {
    icon: "albums-outline",
    title: "A tua coleção está vazia",
    subtitle: "Pesquisa os teus jogos favoritos no BoardGameGeek e começa a criar a tua biblioteca.",
    action: "Adicionar primeiro jogo",
  },
  search: {
    icon: "search-outline",
    title: "Não encontrámos jogos com esse nome.",
    subtitle: "",
    action: "Limpar pesquisa",
  },
  filters: {
    icon: "options-outline",
    title: "Não encontrámos jogos com estes filtros.",
    subtitle: "",
    action: "Limpar filtros",
  },
};

export function CollectionEmptyState({ variant, onActionPress }: Props) {
  const content = CONTENT[variant];

  return (
    <View style={styles.wrap}>
      <Ionicons name={content.icon as any} size={44} color="#ddd" />
      <Text style={styles.title}>{content.title}</Text>
      {!!content.subtitle && <Text style={styles.subtitle}>{content.subtitle}</Text>}
      {content.action && onActionPress && (
        <TouchableOpacity style={styles.btn} onPress={onActionPress} activeOpacity={0.85}>
          <Text style={styles.btnText}>{content.action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.onBackground, textAlign: "center", marginTop: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 19 },
  btn: { marginTop: 8, backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});