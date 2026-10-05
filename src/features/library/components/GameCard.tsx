import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";

import { COLORS } from "@/src/constants/colors";
import { Game } from "@/src/features/games/catalog/types/Game";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";

interface Props {
  game?: Game;
  status?: GameLibraryStatus;
  pricePaid?: number;
  totalTimesPlayed?: number;
  showStatusBadge?: boolean;
  onRemove?: () => void;
  onManage?: () => void;
}

const STATUS_META: Record<number, { label: string; icon: string; color: string }> = {
  [GameLibraryStatus.Owned]: { label: "Tenho o jogo", icon: "📦", color: COLORS.primary },
  [GameLibraryStatus.Wishlist]: { label: "Quero jogar", icon: "❤️", color: COLORS.secondary ?? "#e91e63" },
};

export function GameCard({
  game,
  status,
  pricePaid,
  totalTimesPlayed = 0,
  showStatusBadge = true,
  onRemove,
  onManage,
}: Props) {
  const { t, i18n } = useTranslation("library");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const statusMeta = (status == null ? undefined : STATUS_META[status]) ?? { label: t("status.unknown"), icon: "❔", color: COLORS.textMuted };
  const hasPlayed = totalTimesPlayed > 0;

  if (!game) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={[styles.title, styles.errorText]}>{t("card.notLoaded")}</Text>
      </View>
    );
  }

  const locale = i18n.resolvedLanguage === "pt" ? "pt-PT" : "en-GB";

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={onManage}
        activeOpacity={onManage ? 0.85 : 1}
      >
        {game.imageUrl ? (
          <Image source={{ uri: game.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>🎲</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{game.name}</Text>
          {game.yearPublished && (
            <Text style={styles.subtitle}>{game.yearPublished}</Text>
          )}

          <View style={styles.badgesRow}>
            {showStatusBadge && status != null && (
              <View style={[styles.badge, { backgroundColor: statusMeta.color + "16", borderColor: statusMeta.color + "40" }]}>
                <Text style={styles.badgeEmoji}>{statusMeta.icon}</Text>
                <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
              </View>
            )}

            {typeof pricePaid === "number" && (
              <View style={[styles.badge, styles.priceBadge]}>
                <Text style={styles.badgeEmoji}>{pricePaid > 0 ? "💰" : "🎁"}</Text>
                <Text style={[styles.badgeText, { color: COLORS.success ?? "#2e7d32" }]}>
                  {pricePaid > 0
                    ? new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(pricePaid)
                    : t("card.gifted")}
                </Text>
              </View>
            )}
          </View>

          {hasPlayed && (
            <View style={styles.playedRow}>
              <MaterialIcons name="check-circle" size={14} color={COLORS.success ?? "#2e7d32"} />
              <Text style={styles.playedText}>
                Já jogaste {totalTimesPlayed}x
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionsCol}>
        {onManage && (
          <TouchableOpacity style={styles.iconBtn} onPress={onManage}>
            <MaterialIcons name="edit" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={onRemove}>
            <MaterialIcons name="delete-outline" size={16} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTouchable: { flex: 1, flexDirection: "row" },

  errorCard: { backgroundColor: "#FFE6E6" },
  errorText: { color: COLORS.error },

  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: COLORS.background,
  },

  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { fontSize: 26, color: "#BBBBBB" },

  info: { flex: 1, justifyContent: "center", gap: 4 },

  title: { fontSize: 15, fontWeight: "700", color: COLORS.onBackground },
  subtitle: { fontSize: 12, color: "#888" },

  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    borderWidth: 1,
  },
  priceBadge: { backgroundColor: (COLORS.success ?? "#2e7d32") + "14", borderColor: (COLORS.success ?? "#2e7d32") + "35" },
  badgeEmoji: { fontSize: 11 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  playedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  playedText: { fontSize: 12, color: COLORS.success ?? "#2e7d32", fontWeight: "600" },

  actionsCol: { gap: 6, marginLeft: 6 },
  iconBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.primary + "12",
  },
  iconBtnDanger: { backgroundColor: COLORS.error + "12" },
});
