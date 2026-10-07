import { useEffect, useState } from "react";
import { Keyboard, Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
export default function ClubHeader({ title, subtitle, compact = false }: { title: string; subtitle?: string; compact?: boolean }) {
 const { width } = useWindowDimensions();
 const [keyboardOpen,setKeyboardOpen]=useState(false);
 useEffect(()=>{
  const show=Keyboard.addListener("keyboardDidShow",()=>setKeyboardOpen(true));
  const hide=Keyboard.addListener("keyboardDidHide",()=>setKeyboardOpen(false));
  return ()=>{show.remove();hide.remove();};
 },[]);
 return <View style={[styles.header, compact && styles.compactHeader]}>
  {!keyboardOpen && <View style={[styles.logoViewport, compact && styles.compactViewport]} accessible accessibilityLabel="MeepleBoard" accessibilityRole="image">
   <Image source={require("@/assets/MeepleBoardLogo.png")} style={[styles.logo, compact && styles.compactLogo]} resizeMode="contain" accessible={false}/>
  </View>}
  <Text style={[styles.title, compact && styles.compactTitle]} accessibilityRole="header">{title}</Text>
  {!!subtitle && !keyboardOpen && <Text style={styles.subtitle}>{subtitle}</Text>}
  <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
   style={[styles.curve, {left: Math.min(width,680)/2-50, transform:[{scaleX: Math.min(width,680)*1.3/100}]}]} />
 </View>;
}
const styles=StyleSheet.create({
 compactHeader:{paddingBottom:10,gap:2},compactViewport:{width:88,height:58},
 compactLogo:{width:152,height:152,left:-34,top:-46},compactTitle:{textAlign:"center"},
 header:{backgroundColor:theme.colors.hero,paddingTop:4,paddingBottom:16,paddingHorizontal:20,overflow:"hidden",gap:4},
 logoViewport:{width:104,height:68,overflow:"hidden",alignSelf:"center"},
 logo:{position:"absolute",width:180,height:180,left:-40,top:-54},
 title:{...theme.text.title,color:theme.colors.text},subtitle:{...theme.text.body,color:theme.colors.muted},
 curve:{position:"absolute",bottom:-90,width:100,height:100,borderRadius:50,backgroundColor:theme.colors.background},
});
