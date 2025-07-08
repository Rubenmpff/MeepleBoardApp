import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useRouter, usePathname } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

import { COLORS } from "@/src/constants/colors";
import { ROUTES } from "@/src/constants/routes";
import { User } from "@/src/features/users/types/User";

/** ----------------------------------------------------------------
 *  Custom drawer component
 *  ---------------------------------------------------------------- */
const CustomDrawerContent: React.FC<DrawerContentComponentProps> = () => {
  const router   = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);

  /* ───────────────────────── Load stored user ───────────────────────── */
  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync("current_user");
      if (!raw) return;
      try {
        setUser(JSON.parse(raw));
      } catch (err) {
        console.warn("Failed to parse stored user:", err);
        setUser(null);
      }
    })();
  }, []);

  /* ───────────────────────── Session logout ───────────────────────── */
  const handleLogout = async () => {
    console.log("🔒 Logging out …");
    await Promise.all([
      SecureStore.deleteItemAsync("secure_token"),
      SecureStore.deleteItemAsync("secure_refresh_token"),
      SecureStore.deleteItemAsync("remember_me"),
      SecureStore.deleteItemAsync("current_user"),
    ]);
    router.replace(ROUTES.SIGN_IN);
  };

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Drawer Header ─── */}
        <View style={styles.header}>
          <Ionicons name="rocket-outline" size={28} color={COLORS.primary} />
          <Text style={styles.greeting}>Welcome! 🚀</Text>
        </View>

        {/* ─── Main Navigation ─── */}
        <View style={styles.menuBox}>
          {renderMenuItem(
            "Home",
            "home-outline",
            pathname === ROUTES.HOME,
            () => router.push(ROUTES.HOME)
          )}
          {renderMenuItem(
            "Game Search",
            "magnify",
            pathname === ROUTES.SEARCH_GAMES,
            () => router.push(ROUTES.SEARCH_GAMES)
          )}
          {renderMenuItem("Inbox", "email-outline", false, undefined, 9)}
          {renderMenuItem("Calendar", "calendar-month-outline", false, undefined, 4)}
          {renderMenuItem(
            "My Library",
            "bookshelf",
            pathname === ROUTES.LIBRARY,
            () => router.push(ROUTES.LIBRARY)
          )}
          {renderMenuItem("Activity", "chart-box-outline", false, undefined, 2)}
          {renderMenuItem(
            "Settings",
            "cog-outline",
            pathname === ROUTES.SETTINGS,
            () => router.push(ROUTES.SETTINGS)
          )}
        </View>

        {/* ─── Example Projects section (static) ─── */}
        <Text style={styles.sectionLabel}>Projects (static demo)</Text>
        <View style={styles.projectsBox}>
          {renderProjectItem("Personal", "#FF6B6B", "file-text")}
          {renderProjectItem("Travel",   "#FFD93D", "suitcase")}
          {renderProjectItem("Business", "#4D96FF", "briefcase")}
        </View>
      </ScrollView>

      {/* ─── Bottom profile + logout ─── */}
      <View style={styles.footer}>
        {user && (
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push(ROUTES.PROFILE)}
          >
            {/* Add an avatar here if you have a URL */}
            <View>
              <Text style={styles.profileName}>{user.userName}</Text>
              {!!user.email && (
                <Text style={styles.profileEmail}>{user.email}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/* -------------------------------------------------------------------------- */
/* Helper render functions                                                    */
/* -------------------------------------------------------------------------- */
function renderMenuItem(
  label: string,
  icon: keyof typeof MaterialCommunityIcons.glyphMap,
  isActive: boolean,
  onPress?: () => void,
  badge?: number
) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isActive && styles.menuItemActive]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={isActive ? "#fff" : "#444"}
      />
      <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
        {label}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function renderProjectItem(
  label: string,
  color: string,
  icon: keyof typeof FontAwesome.glyphMap
) {
  return (
    <View style={styles.projectItem}>
      <View style={[styles.projectIcon, { backgroundColor: color }]}>
        <FontAwesome name={icon} size={14} color="#fff" />
      </View>
      <Text style={styles.projectTxt}>{label}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 24,
    paddingBottom: 12,
  },
  greeting: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.onBackground,
  },

  /* Menu ▸ items */
  menuBox: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 10,
    ...shadow(2),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemActive: { backgroundColor: COLORS.primary },
  menuText: { marginLeft: 14, fontSize: 15, flex: 1, color: "#444" },
  menuTextActive: { color: "#fff", fontWeight: "600" },

  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeTxt: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  /* Projects */
  sectionLabel: {
    marginTop: 24,
    marginLeft: 18,
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  projectsBox: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 12,
    ...shadow(2),
  },
  projectItem: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  projectIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  projectTxt: { fontSize: 15, fontWeight: "500", color: COLORS.onBackground },

  /* Footer */
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  profileCard: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  profileName: { fontSize: 15, fontWeight: "600" },
  profileEmail: { fontSize: 12, color: "#888" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  logoutTxt: { color: "#fff", marginLeft: 10, fontWeight: "600" },
});

/* Tiny util for Android shadow */
function shadow(elevation: number) {
  return Platform.OS === "android"
    ? { elevation }
    : {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      };
}

export default CustomDrawerContent;
