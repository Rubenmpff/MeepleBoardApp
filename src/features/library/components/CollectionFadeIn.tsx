// src/features/library/components/CollectionFadeIn.tsx
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

type Props = {
  index: number;
  children: React.ReactNode;
};

export function CollectionFadeIn({ index, children }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      delay: Math.min(index, 10) * 40,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>{children}</Animated.View>;
}