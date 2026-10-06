import { useState } from "react";
import { Image, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";

export default function GameCover({ uri, size = 64 }: { uri?: string | null; size?: number }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return <View style={[styles.frame, { width: size, height: size }]}>
    {uri && failedUri !== uri ? <Image source={{ uri }} resizeMode="contain" style={styles.image}
      onError={() => setFailedUri(uri)} accessible={false} />
      : <MaterialIcons name="casino" size={size * 0.4} color={COLORS.textMuted} />}
  </View>;
}
const styles = StyleSheet.create({
  frame: { borderRadius: 10, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
});
