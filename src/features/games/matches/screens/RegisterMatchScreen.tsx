import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import React from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";

import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import RegisterMatchForm from "@/src/features/games/matches/components/RegisterMatchForm";
import { RootState } from "@/src/store/store";

export default function RegisterMatchScreen() {
  const { t } = useTranslation("matches");
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  return (
    <SafeAreaView style={styles.container}>
      <RegisterMatchForm
        currentUser={
          user
            ? {
                id: user.id,
                userName: user.userName,
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
