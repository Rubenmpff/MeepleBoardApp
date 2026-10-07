import { useEffect, useState } from "react";
import { Keyboard, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import ClubHeader from "@/src/components/ui/ClubHeader";
import { styles } from "./styles";
// Keep the shared logo centered; the back action never takes space from its row.
export default function StatisticsHeader({title,subtitle,backLabel,onBack}:{title:string;subtitle?:string;backLabel:string;onBack:()=>void}) {
 const {width,fontScale}=useWindowDimensions();const [keyboardOpen,setKeyboardOpen]=useState(false);
 useEffect(()=>{const show=Keyboard.addListener("keyboardDidShow",()=>setKeyboardOpen(true));const hide=Keyboard.addListener("keyboardDidHide",()=>setKeyboardOpen(false));return()=>{show.remove();hide.remove();};},[]);
 const stacked=keyboardOpen||width<360||fontScale>1.25;
 return <View>
  {stacked&&<TouchableOpacity style={styles.control} accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack}><Text style={styles.link}>‹ {backLabel}</Text></TouchableOpacity>}
  <ClubHeader title={title} subtitle={subtitle} compact/>
  {!stacked&&<TouchableOpacity style={{position:"absolute",left:8,top:12,minHeight:44,justifyContent:"center",paddingHorizontal:8}} accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack}><Text style={styles.link}>‹ {backLabel}</Text></TouchableOpacity>}
 </View>;
}
