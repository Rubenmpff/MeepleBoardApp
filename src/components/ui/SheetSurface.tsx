import { ReactNode } from "react";
import { Pressable, ScrollView, StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SheetSurface({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable style={[style, { maxHeight: "90%", flexShrink: 1, paddingBottom: 0 }]} onPress={(event) => event.stopPropagation()}>
      <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {children}
      </ScrollView>
    </Pressable>
  );
}
