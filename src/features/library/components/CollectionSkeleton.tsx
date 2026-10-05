// src/features/library/components/CollectionSkeleton.tsx
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { UI_COLORS as COLORS } from "@/src/styles/appTheme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { ViewMode } from "../hooks/useViewModePreference";

function usePulse() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return opacity;
}

function Block({ style }: { style: any }) {
  const opacity = usePulse();
  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

function GridSkeletonCard() {
  return (
    <View style={styles.gridCard}>
      <Block style={{ width: "100%", aspectRatio: 1, borderRadius: 0 }} />
      <View style={{ padding: 10, gap: 6 }}>
        <Block style={{ height: 13, width: "80%" }} />
        <Block style={{ height: 10, width: "50%" }} />
        <Block style={{ height: 26, width: "100%", marginTop: 4 }} />
      </View>
    </View>
  );
}

function ListSkeletonRow() {
  return (
    <View style={styles.listRow}>
      <Block style={{ width: 68, height: 68 }} />
      <View style={{ flex: 1, gap: 6, justifyContent: "center" }}>
        <Block style={{ height: 14, width: "70%" }} />
        <Block style={{ height: 10, width: "40%" }} />
        <Block style={{ height: 10, width: "55%" }} />
      </View>
    </View>
  );
}

export function CollectionSkeleton({ viewMode, count = 6 }: { viewMode: ViewMode; count?: number }) {
  const items = Array.from({ length: count });

  if (viewMode === "list") {
    return <View>{items.map((_, i) => <ListSkeletonRow key={i} />)}</View>;
  }

  return (
    <View style={styles.gridWrap}>
      {items.map((_, i) => <GridSkeletonCard key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: COLORS.border, borderRadius: 6 },
  gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard: { ...UI_STYLES.card, width: "47%", overflow: "hidden" },
  listRow: { ...UI_STYLES.card, flexDirection: "row", gap: 12, padding: 10, marginBottom: 10 },
});
