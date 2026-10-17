import {View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
// Existing board-game glyphs, never a mascot or invented cover. Behind content.
export default function YearDecoration(){return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',top:0,left:0,right:0,bottom:0}}>
 <View style={{position:'absolute',left:8,top:62,opacity:0.3,transform:[{rotate:'-16deg'}]}}><MaterialCommunityIcons name="dice-5" size={28} color="#9EB78C"/></View>
 <View style={{position:'absolute',right:8,bottom:76,opacity:0.25,transform:[{rotate:'12deg'}]}}><MaterialCommunityIcons name="chess-pawn" size={30} color="#9EB78C"/></View>
 <View style={{position:'absolute',right:12,top:28,opacity:0.75}}><MaterialCommunityIcons name="star-four-points" size={20} color="#F5BE32"/></View>
 <View style={{position:'absolute',left:12,bottom:110,opacity:0.65}}><MaterialCommunityIcons name="star-four-points" size={14} color="#F5BE32"/></View>
 </View>;}
