import { useEffect, useState } from "react";
import { Keyboard, Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
export default function ClubHeader({ title, subtitle }: { title: string; subtitle?: string }) {
 const { width } = useWindowDimensions();
 const [keyboardOpen,setKeyboardOpen]=useState(false);
 useEffect(()=>{
  const show=Keyboard.addListener("keyboardDidShow",()=>setKeyboardOpen(true));
  const hide=Keyboard.addListener("keyboardDidHide",()=>setKeyboardOpen(false));
  return ()=>{show.remove();hide.remove();};
 },[]);
 return <View style={styles.header}>
  {!keyboardOpen && <View style={styles.logoViewport} accessible accessibilityLabel="MeepleBoard" accessibilityRole="image">
   <Image source={require("@/assets/MeepleBoardLogo.png")} style={styles.logo} resizeMode="contain" accessible={false}/>
  </View>}
  <Text style={styles.title} accessibilityRole="header">{title}</Text>
  {!!subtitle && !keyboardOpen && <Text style={styles.subtitle}>{subtitle}</Text>}
  <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
   style={[styles.curve, {left: Math.min(width,680)/2-50, transform:[{scaleX: Math.min(width,680)*1.3/100}]}]} />
 </View>;
}
const styles=StyleSheet.create({
 header:{backgroundColor:theme.colors.hero,paddingTop:4,paddingBottom:16,paddingHorizontal:20,overflow:"hidden",gap:4},
 logoViewport:{width:104,height:68,overflow:"hidden",alignSelf:"center"},
 logo:{position:"absolute",width:180,height:180,left:-40,top:-54},
 title:{...theme.text.title,color:theme.colors.text},subtitle:{...theme.text.body,color:theme.colors.muted},
 curve:{position:"absolute",bottom:-90,width:100,height:100,borderRadius:50,backgroundColor:theme.colors.background},
});
