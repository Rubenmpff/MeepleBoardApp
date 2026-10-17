import { useState } from "react";
import { Glyph } from "@/src/ui/components";
import { Image, StyleSheet, View, ViewStyle, ViewProps } from "react-native";
import { colors } from "@/src/ui/theme";

type Props = { uri?: string | null; style?: ViewStyle; onLayout?: ViewProps["onLayout"]; iconSize?: number; size?: number };

// Game cover with a board-game placeholder. Keyed by URI so an earlier image failure cannot hide a new cover.
export default function GameCover({ uri, style, onLayout, iconSize, size }: Props) {
  return <Cover key={uri ?? "missing"} uri={uri} style={size ? [styles.sized, { width: size, height: size }, style] : style} onLayout={onLayout}
    iconSize={iconSize ?? (size ? Math.round(size * 0.4) : 32)} />;
}

function Cover({ uri, style, onLayout, iconSize }: { uri?: string | null; style?: ViewStyle | (ViewStyle | undefined | false)[]; onLayout?: ViewProps["onLayout"]; iconSize: number }) {
  const [failed, setFailed] = useState(false);
  return <View style={[styles.frame, style]} onLayout={onLayout} accessible={false}>
    {uri && !failed ? <Image source={{ uri }} style={styles.image} resizeMode="contain" onError={() => setFailed(true)} accessible={false} />
      : <Glyph name="dice-5" size={iconSize} color={colors.icon} />}
  </View>;
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.hero, alignItems: "center", justifyContent: "center", borderRadius: 12, overflow: "hidden" },
  sized: { borderRadius: 10 },
  image: { width: "100%", height: "100%" },
});
