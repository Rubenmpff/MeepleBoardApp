import {Tabs,usePathname,useRouter} from 'expo-router';
import {useEffect} from 'react';
import {View,useWindowDimensions} from 'react-native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import SummaryHeader from '@/src/features/statistics/components/SummaryHeader';
import AreaNavigation,{Area} from '@/src/features/statistics/components/AreaNavigation';
import {useStatisticsWorkspace} from '@/src/features/statistics/components/Workspace';
import {colors} from '@/src/ui/theme';
export default function AreasLayout(){
 const {width,height,scale,fontScale}=useWindowDimensions();
 useEffect(()=>{
  if(__DEV__) console.info('[Statistics layout]',JSON.stringify({width,height,scale,fontScale}));
 },[width,height,scale,fontScale]);
 const workspace=useStatisticsWorkspace()!;const pathname=usePathname();const router=useRouter();const {t}=useTranslation('statistics');const insets=useSafeAreaInsets();
 const last=pathname.split('/').at(-1);const area:Area=last==='company'||last==='explore'||last==='year'?last:'summary';
 // The header band reaches the top edge; scenes add the bottom inset to their own scroll content.
 return <SafeAreaView style={{flex:1,backgroundColor:colors.background}} edges={['left','right']}>
  <View>
   <SummaryHeader topInset={insets.top} backLabel={t('back')} onBack={()=>{if(area==='company'&&workspace.companyBack.current){workspace.companyBack.current();return;}router.canGoBack()?router.back():router.replace('/dashboard');}}/>
   <AreaNavigation area={area} query={workspace.query} period={workspace.period}/>
  </View>
  <Tabs tabBar={()=>null} detachInactiveScreens={false} screenOptions={{headerShown:false,animation:'none',lazy:true,freezeOnBlur:true,sceneStyle:{backgroundColor:colors.background}}}>
   <Tabs.Screen name="index"/><Tabs.Screen name="company"/><Tabs.Screen name="explore"/><Tabs.Screen name="year"/>
  </Tabs>
 </SafeAreaView>;
}
