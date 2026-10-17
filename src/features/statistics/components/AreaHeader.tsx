import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {View} from 'react-native';
import SummaryHeader from './SummaryHeader';
import {useStatisticsWorkspace} from './Workspace';
import AreaNavigation,{Area} from './AreaNavigation';
import {Period,Query} from '../types/Statistics';
export type {Area} from './AreaNavigation';
// Inside the workspace the persistent header already identifies the area; this only covers standalone use.
export default function AreaHeader({area,query,period,onBack}:{area:Area;query:Query;period:Period;onBack?:()=>void}){
 const workspace=useStatisticsWorkspace();const router=useRouter();const {t}=useTranslation('statistics');const insets=useSafeAreaInsets();
 if(workspace)return null;
 return <View style={{marginHorizontal:-16,marginTop:-16}}><SummaryHeader topInset={insets.top} backLabel={t('back')} onBack={onBack??(()=>router.canGoBack()?router.back():router.replace('/dashboard'))}/><AreaNavigation area={area} query={query} period={period}/></View>;
}
