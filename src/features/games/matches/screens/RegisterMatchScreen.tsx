import React from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";

import { COLORS } from "@/src/constants/colors";
import RegisterMatchForm from "@/src/features/games/matches/components/RegisterMatchForm";
import { RootState } from "@/src/store/store";

export default function RegisterMatchScreen() {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});