import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Generic board-game pieces, without faces or character/mascot attributes.
export default function AuthPlayfulDetails() {
  return (
    <View testID="auth-playful-details" style={styles.details} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.meeple}>
        <View style={styles.head} /><View style={styles.body} />
        <View style={[styles.arm, styles.leftArm]} /><View style={[styles.arm, styles.rightArm]} />
        <View style={[styles.leg, styles.leftLeg]} /><View style={[styles.leg, styles.rightLeg]} />
      </View>
      <MaterialCommunityIcons name="dice-5-outline" size={26} color="#83A997" style={styles.die} />
    </View>
  );
}
const styles = StyleSheet.create({
  details: { width: 68, height: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meeple: { width: 27, height: 32, transform: [{ rotate: "-14deg" }] },
  head: { position: "absolute", width: 9, height: 9, borderRadius: 5, backgroundColor: "#A3BEAE", left: 9, top: 0 },
  body: { position: "absolute", width: 11, height: 16, borderRadius: 3, backgroundColor: "#A3BEAE", left: 8, top: 8 },
  arm: { position: "absolute", width: 7, height: 17, borderRadius: 2, backgroundColor: "#A3BEAE", top: 8 },
  leftArm: { left: 3, transform: [{ rotate: "42deg" }] }, rightArm: { right: 3, transform: [{ rotate: "-42deg" }] },
  leg: { position: "absolute", width: 8, height: 13, borderRadius: 2, backgroundColor: "#A3BEAE", top: 19 },
  leftLeg: { left: 6, transform: [{ rotate: "17deg" }] }, rightLeg: { right: 6, transform: [{ rotate: "-17deg" }] },
  die: { transform: [{ rotate: "15deg" }] },
});
