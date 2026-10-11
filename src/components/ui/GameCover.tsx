import { useState } from "react";
import { Image, StyleSheet, View, ViewStyle, ViewProps } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
// Key the inner component by URI so an earlier image failure cannot hide a new cover.
export default function GameCover({ uri, style, onLayout, iconSize = 32 }: { uri?: string | null; style?: ViewStyle; onLayout?: ViewProps["onLayout"]; iconSize?: number }) {
 return <Cover key={uri ?? "missing"} uri={uri} style={style} onLayout={onLayout} iconSize={iconSize}/>;
}
function Cover({uri,style,onLayout,iconSize}:{uri?:string|null;style?:ViewStyle;onLayout?:ViewProps["onLayout"];iconSize:number}) {
 const [failed,setFailed]=useState(false);
 return <View style={[styles.frame,style]} onLayout={onLayout} accessible={false}>
  {uri && !failed ? <Image source={{uri}} style={styles.image} resizeMode="contain" onError={()=>setFailed(true)} accessible={false}/> :
   <MaterialIcons name="casino" size={iconSize} color={theme.colors.muted}/>}
 </View>;
}
const styles=StyleSheet.create({frame:{backgroundColor:theme.colors.hero,alignItems:"center",justifyContent:"center",borderRadius:12,overflow:"hidden"},image:{width:"100%",height:"100%"}});
