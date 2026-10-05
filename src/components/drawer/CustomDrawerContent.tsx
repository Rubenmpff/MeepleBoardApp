import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  usePathname,
  useRouter,
} from "expo-router";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";
import { RootState } from "@/src/store/store";
import { logout } from "@/src/features/auth/store/authSlice";
import { usePendingJournal } from "@/src/features/games/matches/hooks/usePendingJournal";

/*
 * O Drawer do Expo Router (SDK 56+) já não deve ser tipado através de
 * @react-navigation/drawer.
 *
 * Este componente não utiliza diretamente state/navigation/descriptors
 * recebidos pelo drawerContent, por isso aceitamos os props que o Drawer
 * fornece sem criar uma dependência de tipos externa.
 */
type CustomDrawerContentProps =
  Record<string, unknown>;

const CustomDrawerContent: React.FC<
  CustomDrawerContentProps
> = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { t } = useTranslation("navigation");

  // ✅ Mesma fonte de verdade que o resto da app (RegisterMatchScreen, etc.)
  // — evita ficar dessincronizado do SecureStore depois de editar o perfil.
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  // ✅ Badge real de avaliações de partidas por fazer (substitui o "Inbox: 9" fixo)
  const { count: pendingJournalCount } =
    usePendingJournal();

  const initials =
    (user?.userName ?? "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  function handleLogout() {
    // ✅ Usa a ação do slice — limpa Redux E SecureStore de uma vez,
    // em vez de só apagar chaves do SecureStore e deixar o Redux "logado".
    dispatch(logout());
    router.replace(ROUTES.SIGN_IN);
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* ── Cabeçalho: identidade do jogador ── */}
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={() =>
            router.push(ROUTES.PROFILE)
          }
          activeOpacity={0.85}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.profileName}
              numberOfLines={1}
            >
              {user?.userName ?? t("welcome")}
            </Text>

            {!!user?.email && (
              <Text
                style={styles.profileEmail}
                numberOfLines={1}
              >
                {user.email}
              </Text>
            )}
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        {/* ── Navegação principal ── */}
        <View style={styles.menuBox}>
          {renderMenuItem(
            t("home"),
            "view-dashboard-outline",
            pathname === ROUTES.HOME,
            () => router.push(ROUTES.HOME)
          )}

          {renderMenuItem(
            t("gameSearch"),
            "magnify",
            pathname === ROUTES.SEARCH_GAMES,
            () =>
              router.push(ROUTES.SEARCH_GAMES)
          )}

          {renderMenuItem(
            t("library"),
            "bookshelf",
            pathname === ROUTES.LIBRARY,
            () => router.push(ROUTES.LIBRARY)
          )}

          {renderMenuItem(
            t("rankings", {
              defaultValue: "Rankings",
            }),
            "trophy-outline",
            pathname === ROUTES.RANKINGS,
            () => router.push(ROUTES.RANKINGS)
          )}

          {renderMenuItem(
            t("sessions", {
              defaultValue: "Sessões",
            }),
            "calendar-star",
            pathname === ROUTES.SESSIONS,
            () => router.push(ROUTES.SESSIONS)
          )}

          {renderMenuItem(
            t("campaigns", {
              defaultValue: "Campanhas",
            }),
            "book-open-page-variant-outline",
            pathname === ROUTES.CAMPAIGNS,
            () =>
              router.push(ROUTES.CAMPAIGNS)
          )}

          {renderMenuItem(
            t("friends", {
              defaultValue: "Amigos",
            }),
            "account-multiple-outline",
            pathname === ROUTES.FRIENDS,
            () => router.push(ROUTES.FRIENDS)
          )}

          {renderMenuItem(
            t("pendingJournal", {
              defaultValue:
                "Avaliações Pendentes",
            }),
            "star-outline",
            pathname ===
              ROUTES.PENDING_JOURNAL,
            () =>
              router.push(
                ROUTES.PENDING_JOURNAL
              ),
            pendingJournalCount > 0
              ? pendingJournalCount
              : undefined
          )}
        </View>

        {/* ── Definições ── */}
        <View style={styles.menuBox}>
          {renderMenuItem(
            t("settings"),
            "cog-outline",
            pathname === ROUTES.SETTINGS,
            () => router.push(ROUTES.SETTINGS)
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.logoutTxt}>
            {t("logout")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

function renderMenuItem(
  label: string,
  icon:
    keyof typeof MaterialCommunityIcons.glyphMap,
  isActive: boolean,
  onPress?: () => void,
  badge?: number
) {
  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        isActive &&
          styles.menuItemActive,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={
          isActive
            ? "#FFFFFF"
            : COLORS.onBackground
        }
      />

      <Text
        style={[
          styles.menuText,
          isActive &&
            styles.menuTextActive,
        ]}
      >
        {label}
      </Text>

      {badge ? (
        <View
          style={[
            styles.badge,
            isActive &&
              styles.badgeOnActive,
          ]}
        >
          <Text style={styles.badgeTxt}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android"
        ? StatusBar.currentHeight ?? 24
        : 24,
    paddingBottom: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.onBackground,
  },

  profileEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  menuBox: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 10,
    ...shadow(2),
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  menuItemActive: {
    backgroundColor: COLORS.primary,
  },

  menuText: {
    marginLeft: 14,
    fontSize: 15,
    flex: 1,
    color: COLORS.onBackground,
  },

  menuTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },

  badgeOnActive: {
    backgroundColor: "#FFFFFF33",
  },

  badgeTxt: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
  },

  logoutTxt: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontWeight: "600",
  },
});

function shadow(elevation: number) {
  return Platform.OS === "android"
    ? { elevation }
    : {
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: {
          width: 0,
          height: 3,
        },
      };
}

export default CustomDrawerContent;
