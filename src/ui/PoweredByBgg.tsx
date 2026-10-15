/**
 * The official «Powered by BGG» logo, as supplied (assets/brand/bgg/powered-by-bgg.webp, 900 × 264 px with its own
 * transparent margins). Never cropped, recoloured or stretched: only its height is chosen and the width follows.
 * It grows with larger text so the lettering stays legible. Decorative: the touchable around it carries the label.
 */
import { Image, useWindowDimensions } from "react-native";

const LOGO = require("@/assets/brand/bgg/powered-by-bgg.webp");
const RATIO = 900 / 264;

export default function PoweredByBgg({ height }: { height: number }) {
  const { fontScale } = useWindowDimensions();
  const h = Math.round(height * Math.min(Math.max(fontScale, 1), 1.35));
  return <Image source={LOGO} style={{ height: h, width: h * RATIO }} resizeMode="contain" accessible={false} />;
}
