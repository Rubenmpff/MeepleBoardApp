import { useState } from "react";
import { Image, Text } from "react-native";
import { colors, strong, type } from "./theme";

// A person's photo, falling back to their initial if it does not load. Kept apart so Avatar stays stateless.
export default function AvatarPhoto({ name, uri, size, color = colors.primary }: { name: string; uri: string; size: number; color?: string }) {
 const [failed, setFailed] = useState(false);
 return failed ? <Text style={[type.body, strong, { color }]}>{name.slice(0, 1).toLocaleUpperCase() || "?"}</Text>
  : <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailed(true)} accessible={false} />;
}
