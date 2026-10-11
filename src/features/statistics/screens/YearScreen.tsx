import {useStatisticsWorkspace} from '../Workspace';
import {useRef,useState} from 'react';
import {ActivityIndicator,Modal,ScrollView,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {captureRef,releaseCapture} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import SummaryHeader from '../summary/SummaryHeader';
import AreaHeader from '../summary/AreaHeader';
import {FilterButton,FiltersSheet,activeFilterCount,useFilterLabels} from '../ExploreFilters';
import useRouteQuery from '../useRouteQuery';
import useReport from '../hooks/useReport';
import service from '../services/statisticsService';
import {Metric,Period,YearReport} from '../types';
import YearCard from '../YearCard';
import {YEAR_CARDS,publicYearCard} from '../yearCards';
import GameCover from '@/src/components/ui/GameCover';
import ScreenScroll from '../ui/Screen';
import {Button,Card,Disclosure,EmptyState,Glyph,Note,Row,Section} from '../ui/components';
import {colors,space,touch,type} from '../ui/theme';
export default function YearScreen(){
 const workspace=useStatisticsWorkspace();
 const {query,setQuery,value}=useRouteQuery();const insets=useSafeAreaInsets();const {t,i18n}=useTranslation('statistics');const router=useRouter();
 const [year,setYear]=useState(Number(value('year')||query.start.slice(0,4))),[index,setIndex]=useState(0),[preview,setPreview]=useState(false),[sharing,setSharing]=useState(false),[shareError,setShareError]=useState(false),[filters,setFilters]=useState(false);
 const capture=useRef<View|null>(null);const scroll=useRef<ScrollView|null>(null);
 const report=useReport<YearReport>(JSON.stringify({kind:'year',year,gameId:query.gameId,mode:query.mode,timeZone:query.timeZone}),signal=>service.year(year,query,signal));const data=report.data;const id=YEAR_CARDS[index];
 const fullQuery={...query,start:`${year}-01-01`,endExclusive:`${year+1}-01-01`};
 const thisYear=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:query.timeZone}).format(new Date()));
 const labels=useFilterLabels(query,data?.summary.gameOptions??[]);
 const change=(next:number)=>{setIndex(next);scroll.current?.scrollTo({y:0,animated:false});};
 const share=async()=>{if(sharing||!capture.current)return;setSharing(true);setShareError(false);let uri:string|undefined;
  try{if(!await Sharing.isAvailableAsync())throw new Error('unavailable');uri=await captureRef(capture.current,{format:'png',quality:1,result:'tmpfile'});await Sharing.shareAsync(uri,{mimeType:'image/png',UTI:'public.png',dialogTitle:t('shareYearCard')});}
  catch{setShareError(true);}finally{if(uri)releaseCapture(uri);setSharing(false);}
 };
 const show=(metric:Metric,extra:Record<string,string>={})=>router.push({pathname:'/statistics/matches',params:{...fullQuery,...extra,metric}} as never);
 const links=data?publicYearCard(data,id):null;
 const monthName=(key:string)=>new Intl.DateTimeFormat(i18n.language,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${key}-01T12:00:00Z`));
 const goYear=(next:number)=>{setYear(next);setIndex(0);};
 const access=data&&links?[
  ...links.leaders.map(g=>({key:g.gameId+(g.mode??''),title:g.name,lead:<GameCover uri={g.imageUrl} style={s.cover} iconSize={22}/>,label:`${g.name} · ${t('viewMatches')}`,onPress:()=>show(id==='wins'?'wins':id==='rate'?'known':'all',{gameId:g.gameId,...(g.mode?{mode:g.mode}:{})})})),
  ...(id==='month'?data.activeMonths.map(b=>({key:b.key,title:monthName(b.key),lead:undefined,label:`${b.key} · ${t('viewMatches')}`,onPress:()=>show('all',{bucket:b.key})})):[]),
  ...(id==='overview'||id==='time'?[{key:id,title:t('viewMatches'),lead:undefined,label:t('viewMatches'),onPress:()=>show(id==='time'?'duration':'all')}]:[]),
  ...(id==='company'?[{key:id,title:t('openCompany'),lead:undefined,label:t('company'),onPress:()=>{workspace?.setQuery(fullQuery);workspace?.setPeriod('year');router.navigate({pathname:'/statistics/company',params:{...fullQuery,period:'year'}} as never);}}]:[]),
 ]:[];
 return <SafeAreaView style={s.screen} edges={workspace?[]:['top','left','right']}><ScreenScroll ref={scroll}>
  <View style={s.group}>
   <AreaHeader area="year" query={query} period={(value('period')||'year') as Period}/>
   <Card>
    <View style={s.years}>
     <TouchableOpacity style={[s.arrow,year<=1900&&s.off]} accessibilityRole="button" accessibilityLabel={t('previousYear')} disabled={year<=1900} accessibilityState={{disabled:year<=1900}} onPress={()=>goYear(year-1)}><Glyph name="chevron-left" size={26} color={colors.primary}/></TouchableOpacity>
     <View style={s.yearLabel}><Text style={type.head}>{year}</Text><Text style={type.caption}>{year===thisYear?t('toDate'):t('fullYear')}</Text></View>
     <TouchableOpacity style={[s.arrow,year>=thisYear&&s.off]} accessibilityRole="button" accessibilityLabel={t('nextYear')} disabled={year>=thisYear} accessibilityState={{disabled:year>=thisYear}} onPress={()=>goYear(year+1)}><Glyph name="chevron-right" size={26} color={colors.primary}/></TouchableOpacity>
    </View>
    <View style={s.filterRow}>
     <Text style={[type.caption,s.flex]}>{labels.game} · {labels.mode}</Text>
     <FilterButton count={activeFilterCount(query)} expanded={filters} onPress={()=>setFilters(true)}/>
    </View>
   </Card>
  </View>
  {report.busy&&<ActivityIndicator color={colors.primary}/>}
  {report.error&&<Card padded style={s.state}><Text style={type.body} accessibilityRole="alert">{t('error')}</Text><Button title={t('retry')} onPress={report.refresh}/></Card>}
  {data&&(data.summary.matches===0?<EmptyState title={t('emptyTitle',{period:String(year)})} message={t('emptyYear')} action={year>1900?<Button icon="chevron-left" title={t('viewYear',{year:year-1})} onPress={()=>goYear(year-1)}/>:undefined}/>:<>
   <View style={s.group}>
    <View style={s.progress}><View style={s.dots} accessible={false}>{YEAR_CARDS.map((card,i)=><View key={card} style={[s.dot,i<=index&&s.dotOn]}/>)}</View><Text style={type.caption}>{t('cardProgress',{current:index+1,total:YEAR_CARDS.length})}</Text></View>
    <YearCard report={data} id={id}/>
    <View style={s.buttons}>
     <Button style={s.flex} variant="secondary" icon="chevron-left" title={t('previousCard')} disabled={index===0} onPress={()=>change(index-1)}/>
     <Button style={s.flex} variant="primary" iconEnd="chevron-right" title={t('nextCard')} disabled={index===YEAR_CARDS.length-1} onPress={()=>change(index+1)}/>
    </View>
   </View>
   {access.length>0&&<Section title={t('inThisCard')}><Card>
    {access.map((a,i)=><Row key={a.key} first={i===0} inset={a.lead?72:16} lead={a.lead} title={a.title} subtitle={a.lead?t('viewMatches'):undefined} strongTitle={!!a.lead} accessibilityLabel={a.label} onPress={a.onPress}/>)}
   </Card></Section>}
   <Section title={t('share')}><Card padded style={s.share}>
    <View style={s.privacy}><Glyph name="shield-check" size={24} color={colors.primary}/><View style={s.flex}><Text style={[type.body,{fontWeight:'600'}]}>{t('anonymousFriends')}</Text><Note>{t('anonymousShare')}</Note></View></View>
    <Button icon="share-variant-outline" title={t('previewShare')} onPress={()=>{setShareError(false);setPreview(true);}}/>
   </Card></Section>
  </>)}
  <Section title={t('moreDetails')}><Card><Disclosure first title={t('howCalculated')}>
   <Note>{t('historyScope')}</Note><Note>{t('firstHistoryNote')}</Note><Note>{t('timeZone',{zone:query.timeZone})}</Note><Note>{t('yearFilters')}</Note>
  </Disclosure></Card></Section>
 </ScreenScroll>
 <FiltersSheet visible={filters} periodEditable={false} query={query} period="year" games={data?.summary.gameOptions??[]} onClose={()=>setFilters(false)} onApply={next=>{setQuery({...query,gameId:next.gameId,mode:next.mode});setFilters(false);}}/>
 <Modal visible={preview&&!!data} animationType="slide" onRequestClose={()=>{if(!sharing)setPreview(false);}}>
  <SafeAreaView style={s.screen} edges={['left','right']}>
   <SummaryHeader topInset={insets.top} backLabel={t('back')} onBack={()=>{if(!sharing)setPreview(false);}}/>
   <ScreenScroll>
    <Text style={[type.title,{textAlign:'center'}]} accessibilityRole="header">{t('previewShare')}</Text>
    <View style={s.group}>
     {data&&<View ref={capture} collapsable={false}><YearCard report={data} id={id} variant="share"/></View>}
     <View style={s.privacy}><Glyph name="shield-check" size={24} color={colors.primary}/><View style={s.flex}><Text style={[type.body,{fontWeight:'600'}]}>{t('anonymousFriends')}</Text><Note>{t('anonymousShare')}</Note></View></View>
     <Note>{t('shareLocalNote')}</Note>
     {shareError&&<Text style={[type.body,{color:colors.loss}]} accessibilityRole="alert">{t('shareFailed')}</Text>}
     <Button variant="primary" icon="share-variant-outline" title={sharing?t('preparingShare'):t('shareYearCard')} disabled={sharing} onPress={share}/>
     <Button icon="arrow-left" title={t('backToYearCard')} disabled={sharing} onPress={()=>setPreview(false)}/>
    </View>
   </ScreenScroll>
  </SafeAreaView>
 </Modal></SafeAreaView>;
}

const s=StyleSheet.create({
 screen:{flex:1,backgroundColor:colors.background},
 flex:{flex:1,minWidth:0},
 group:{gap:space.md},
 state:{gap:space.md,alignItems:'flex-start'},
 years:{flexDirection:'row',alignItems:'center',minHeight:52},
 arrow:{width:48,minHeight:touch,alignItems:'center',justifyContent:'center'},
 off:{opacity:0.35},
 yearLabel:{flex:1,minWidth:0,alignItems:'center',paddingVertical:4},
 filterRow:{flexDirection:'row',alignItems:'center',borderTopWidth:1,borderTopColor:colors.hair,paddingLeft:space.lg},
 progress:{flexDirection:'row',alignItems:'center',gap:space.md},
 dots:{flex:1,flexDirection:'row',gap:4},
 dot:{flex:1,height:4,borderRadius:2,backgroundColor:'#DCD6E2'},
 dotOn:{backgroundColor:colors.primary},
 buttons:{flexDirection:'row',gap:space.md},
 cover:{width:44,height:44,borderRadius:10},
 share:{gap:space.md},
 privacy:{flexDirection:'row',alignItems:'flex-start',gap:space.md},
});
