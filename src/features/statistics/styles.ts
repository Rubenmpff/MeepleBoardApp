import { StyleSheet } from "react-native";
import { APP_THEME as theme, UI_STYLES } from "@/src/styles/clubTheme";
export const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:theme.colors.background},content:{width:"100%",maxWidth:680,alignSelf:"center",padding:16,paddingBottom:40,gap:16},
 row:{flexDirection:"row",flexWrap:"wrap",alignItems:"center",gap:8},stack:{gap:12},card:{...UI_STYLES.card,padding:16,gap:8,borderColor:"#E3DEE8",borderWidth:1},
 title:{...theme.text.section,color:theme.colors.text},text:{...theme.text.body,color:theme.colors.text},muted:{...theme.text.body,color:theme.colors.muted},
 control:{minHeight:44,paddingHorizontal:12,paddingVertical:10,borderRadius:12,borderWidth:1,borderColor:theme.colors.border,justifyContent:"center",backgroundColor:theme.colors.card},
 selected:{backgroundColor:theme.colors.primary},selectedText:{color:theme.colors.onPrimary},link:{...theme.text.body,color:theme.colors.primary,fontWeight:"600"},
 value:{fontSize:28,lineHeight:36,fontWeight:"700",color:theme.colors.text},summary:{backgroundColor:theme.colors.hero,borderRadius:16,padding:4},metric:{minHeight:88,padding:12,flexGrow:1,flexBasis:180,gap:4},metricArrow:{fontSize:22,color:theme.colors.primary},
 input:{...UI_STYLES.field},gameRow:{flexDirection:"row",alignItems:"flex-start",gap:12,paddingVertical:12,minHeight:60},
 gameName:{...theme.text.body,fontWeight:"700",color:theme.colors.text},cover:{width:68,height:68},grow:{flex:1,minWidth:0,gap:6},
});
