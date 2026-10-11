import {ScrollView,StyleSheet,Text,TouchableOpacity,View,useWindowDimensions} from 'react-native';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {Period,Query} from '../types';
import {colors,isLarge,strong,touch,type} from '../ui/theme';
export type Area='summary'|'company'|'explore'|'year';
// Area navigation: green underline. With large text the areas become a horizontal strip.
export default function AreaNavigation({area,query,period}:{area:Area;query:Query;period:Period}){
 const router=useRouter();const {t}=useTranslation('statistics');const {width,fontScale}=useWindowDimensions();const large=isLarge(width,fontScale);
 const tabs=(['summary','company','explore','year'] as Area[]).map(item=>{const on=item===area;return <TouchableOpacity key={item} style={[s.tab,large&&s.tabLarge]} accessibilityRole="tab" accessibilityLabel={t(`areas.${item}`)} accessibilityState={{selected:on}} onPress={()=>{
  if(on)return;
  router.navigate({pathname:item==='summary'?'/statistics':`/statistics/${item}`,params:{...query,period}} as never);
 }}><View style={s.labelBox}><Text style={[type.body,{color:on?colors.primary:colors.muted},on?strong:s.medium]} numberOfLines={1}>{t(`areas.${item}`)}</Text>{on&&<View style={s.underline}/>}</View></TouchableOpacity>;});
 return <View style={s.bar}>{large?<ScrollView horizontal accessibilityRole="tablist" showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip}>{tabs}</ScrollView>:<View style={s.row} accessibilityRole="tablist">{tabs}</View>}</View>;
}
const s=StyleSheet.create({
 bar:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.line},
 row:{flexDirection:'row',paddingHorizontal:8,width:'100%',maxWidth:680,alignSelf:'center'},
 strip:{paddingHorizontal:16,gap:22},
 tab:{flex:1,minWidth:0,minHeight:touch,alignItems:'center',justifyContent:'center'},
 tabLarge:{flex:0,minWidth:touch},
 labelBox:{minHeight:touch,justifyContent:'center',paddingHorizontal:4},
 medium:{fontWeight:'500'},
 underline:{position:'absolute',bottom:-1,height:3,borderTopLeftRadius:3,borderTopRightRadius:3,backgroundColor:colors.primary,left:0,right:0},
});
