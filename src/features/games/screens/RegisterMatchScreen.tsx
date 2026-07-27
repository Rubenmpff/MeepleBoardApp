import React from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";

import RegisterMatchForm from "@/src/features/games/components/RegisterMatchForm";
import { COLORS } from "@/src/constants/colors";
import { RootState } from "@/src/store/store";

export default function RegisterMatchScreen() {
  const user = useSelector((state: RootState) => state.auth.user);

  console.log("AUTH USER =>", user); // ✅ mete aqui

  return (
    <View style={styles.container}>
      <RegisterMatchForm
        currentUser={user ? { id: user.id, userName: user.userName } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});