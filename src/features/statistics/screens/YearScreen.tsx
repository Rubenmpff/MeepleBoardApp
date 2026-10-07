import {useRef,useState} from 'react';
import {ActivityIndicator,Modal,ScrollView,Text,TouchableOpacity,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {captureRef,releaseCapture} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import StatisticsHeader from '../StatisticsHeader';
import useRouteQuery from '../useRouteQuery';
import useReport from '../hooks/useReport';
import service from '../services/statisticsService';
import {Metric,YearReport} from '../types';
import YearCard from '../YearCard';
import {YEAR_CARDS,publicYearCard} from '../yearCards';
import Button from '@/src/components/ui/ClubPrimaryButton';
import {APP_THEME as theme} from '@/src/styles/clubTheme';
import {styles} from '../styles';
export default function YearScreen(){
 const {query,value}=useRouteQuery();const {t}=useTranslation('statistics');const router=useRouter();
 const [year,setYear]=useState(Number(value('year')||query.start.slice(0,4))),[index,setIndex]=useState(0),[preview,setPreview]=useState(false),[sharing,setSharing]=useState(false),[shareError,setShareError]=useState(false);
 const capture=useRef<View|null>(null);const scroll=useRef<ScrollView|null>(null);
 const report=useReport<YearReport>(JSON.stringify({kind:'year',year,query}),signal=>service.year(year,query,signal));const data=report.data;const id=YEAR_CARDS[index];
 const fullQuery={...query,start:`${year}-01-01`,endExclusive:`${year+1}-01-01`};
 const change=(next:number)=>{setIndex(next);scroll.current?.scrollTo({y:0,animated:false});};
 const share=async()=>{if(sharing||!capture.current)return;setSharing(true);setShareError(false);let uri:string|undefined;
  try{if(!await Sharing.isAvailableAsync())throw new Error('unavailable');uri=await captureRef(capture.current,{format:'png',quality:1,result:'tmpfile'});await Sharing.shareAsync(uri,{mimeType:'image/png',UTI:'public.png',dialogTitle:t('shareYearCard')});}
  catch{setShareError(true);}finally{if(uri)releaseCapture(uri);setSharing(false);}
 };
 const show=(metric:Metric,extra:Record<string,string>={})=>router.push({pathname:'/statistics/matches',params:{...fullQuery,...extra,metric}} as never);
 const links=data?publicYearCard(data,id):null;
 return <SafeAreaView style={styles.screen} edges={['top','left','right']}><ScrollView ref={scroll} contentContainerStyle={styles.content}>
  <StatisticsHeader title={t('yearAtTable')} backLabel={t('back')} onBack={()=>router.canGoBack()?router.back():router.replace('/statistics')}/>
  <View style={styles.row}><Button variant="secondary" title={t('previousYear')} disabled={year<=1900} onPress={()=>{setYear(y=>y-1);setIndex(0);}}/><Text style={styles.title}>{year}</Text><Button variant="secondary" title={t('nextYear')} disabled={year>=new Date().getFullYear()} onPress={()=>{setYear(y=>y+1);setIndex(0);}}/></View>
  <Text style={styles.muted}>{t('yearScope')}{query.mode?` · ${t(`modes.${query.mode}`)}`:''}</Text>
  {report.busy&&<ActivityIndicator color={theme.colors.primary}/>}{report.error&&<Button title={t('retry')} onPress={report.refresh}/>}
  {data&&<>
   {data.summary.matches===0?<Text style={styles.text}>{t('emptyYear')}</Text>:<>
    <Text style={styles.muted}>{t('cardProgress',{current:index+1,total:YEAR_CARDS.length})}</Text>
    <YearCard report={data} id={id}/>
    <View style={styles.row}><Button variant="secondary" title={t('previousCard')} disabled={index===0} onPress={()=>change(index-1)}/><Button title={t('nextCard')} disabled={index===YEAR_CARDS.length-1} onPress={()=>change(index+1)}/></View>
    {links?.leaders.map(g=><TouchableOpacity key={g.gameId+(g.mode??'')} style={styles.inlineAction} accessibilityRole="button" onPress={()=>show(id==='wins'?'wins':id==='rate'?'known':'all',{gameId:g.gameId,...(g.mode?{mode:g.mode}:{})})}><Text style={styles.link}>{g.name} · {t('viewMatches')} ›</Text></TouchableOpacity>)}
    {id==='month'&&data.activeMonths.map(b=><TouchableOpacity key={b.key} style={styles.inlineAction} accessibilityRole="button" onPress={()=>show('all',{bucket:b.key})}><Text style={styles.link}>{b.key} · {t('viewMatches')} ›</Text></TouchableOpacity>)}
    {id==='company'?<Button variant="secondary" title={t('company')} onPress={()=>router.push({pathname:'/statistics/company',params:{...fullQuery,period:'year'}} as never)}/>:id==='overview'||id==='time'?<Button variant="secondary" title={t('viewMatches')} onPress={()=>show(id==='time'?'duration':'all')}/>:null}
    <Text style={styles.muted}>{t('anonymousShare')}</Text>
    <Button title={t('previewShare')} onPress={()=>{setShareError(false);setPreview(true);}}/>
   </>}
  </>}
 </ScrollView>
 <Modal visible={preview&&!!data} animationType="none" onRequestClose={()=>{if(!sharing)setPreview(false);}}>
  <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
   <StatisticsHeader title={t('previewShare')} backLabel={t('back')} onBack={()=>{if(!sharing)setPreview(false);}}/>
   {data&&<View ref={capture} collapsable={false}><YearCard report={data} id={id}/></View>}
   <Text style={styles.muted}>{t('anonymousShare')}</Text><Text style={styles.muted}>{t('shareLocalNote')}</Text>
   {shareError&&<Text style={styles.text} accessibilityRole="alert">{t('shareFailed')}</Text>}
   <Button title={sharing?t('preparingShare'):t('shareYearCard')} disabled={sharing} onPress={share}/>
  </ScrollView></SafeAreaView>
 </Modal></SafeAreaView>;
}
