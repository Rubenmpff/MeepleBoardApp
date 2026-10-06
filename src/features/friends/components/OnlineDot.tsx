/**
 * OnlineDot.tsx
 *
 * Pontinho verde no canto do avatar a indicar "online agora". É só um
 * indicador visual — a lógica de "o que conta como online" vive no backend
 * (LastActiveMiddleware + IsOnline nos DTOs), aqui só desenhamos o resultado.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";

export default function OnlineDot({ size = 13 }: { size?: number }) {
  return <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }]} />;
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
});