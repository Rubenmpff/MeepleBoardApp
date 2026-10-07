import {useRef,useState} from 'react';
import {ActivityIndicator,KeyboardAvoidingView,Platform,ScrollView,Text,TouchableOpacity,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import StatisticsHeader from '../StatisticsHeader';
import ExploreFilters from '../ExploreFilters';
import useRouteQuery from '../useRouteQuery';
import useReport from '../hooks/useReport';
import useStatistics from '../hooks/useStatistics';
import service from '../services/statisticsService';
import {CompanyReport,Metric,Mode} from '../types';
import GameCover from '@/src/components/ui/GameCover';
import {APP_THEME as theme} from '@/src/styles/clubTheme';
import {styles} from '../styles';
export default function CompanyScreen(){
 const {query,setQuery,period,value}=useRouteQuery();const router=useRouter();const {t,i18n}=useTranslation('statistics');
 const [friendId,setFriendId]=useState<string|undefined>(value('friendId')),[chooser,setChooser]=useState(false),[notes,setNotes]=useState(false);
 const report=useReport<CompanyReport>(JSON.stringify({kind:'company',query,friendId}),signal=>service.company(query,friendId,signal));
 const summary=useStatistics(query);const data=report.data;const scroll=useRef<ScrollView|null>(null);
 const selectFriend=(id:string)=>{setFriendId(id);setChooser(false);scroll.current?.scrollTo({y:0,animated:false});};
 const num=(n:number|null)=>n==null?'—':new Intl.NumberFormat(i18n.language,{maximumFractionDigits:2}).format(n);
 const show=(metric:Metric,extra:{gameId?:string;mode?:Mode;bucket?:string}={})=>router.push({pathname:'/statistics/matches',params:{...query,...extra,friendId,metric}} as never);
 const row=(label:string,n:number,metric:Metric,mode?:Mode)=><TouchableOpacity key={metric} style={styles.inlineAction} accessibilityRole="button" accessibilityLabel={`${label}: ${n}`} accessibilityHint={t('viewSupporting')} onPress={()=>show(metric,mode?{mode}:{})}><Text style={[styles.text,styles.grow]}>{label}</Text><Text style={styles.inlineValue}>{num(n)}</Text><Text style={styles.link}>›</Text></TouchableOpacity>;
 const date=(iso:string)=>new Intl.DateTimeFormat(i18n.language,{dateStyle:'medium',timeZone:query.timeZone}).format(new Date(iso));
 return <SafeAreaView style={styles.screen} edges={['top','left','right']}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
  <StatisticsHeader title={t('company')} backLabel={t('back')} onBack={()=>router.canGoBack()?router.back():router.replace('/statistics')}/>
  <ExploreFilters query={query} onChange={setQuery} games={summary.data?.gameOptions??[]} initialPeriod={period}/>
  <TouchableOpacity style={styles.selector} accessibilityRole="button" accessibilityLabel={t('chooseFriend')} accessibilityState={{expanded:chooser}} onPress={()=>setChooser(v=>!v)}><Text style={[styles.selectorValue,styles.grow]}>{data?.friendName||data?.companions.find(c=>c.friendId===friendId)?.name||t('chooseFriend')} ⌄</Text></TouchableOpacity>
  {chooser&&<View style={styles.options}>{data?.companions.map(c=><TouchableOpacity key={c.friendId} style={styles.option} accessibilityRole="button" accessibilityLabel={t('selectFriend',{name:c.name})} onPress={()=>selectFriend(c.friendId)}><Text style={styles.text}>{c.name||t('unavailable')} · {t('matchCount',{count:c.matches})}</Text></TouchableOpacity>)}</View>}
  {report.busy&&<ActivityIndicator color={theme.colors.primary}/>}
  {report.error&&<TouchableOpacity style={styles.inlineAction} accessibilityRole="button" onPress={report.refresh}><Text style={styles.text} accessibilityRole="alert">{t('error')}</Text><Text style={styles.link}>{t('retry')}</Text></TouchableOpacity>}
  {data&&<>
   {!friendId&&<Text style={styles.muted}>{t('companyIntro')}</Text>}
   {friendId&&<>
    <View style={styles.summary}>{row(t('jointMatches'),data.matches,'pair-all')}<Text style={styles.muted}>{t('pairSample',{known:data.results.known,total:data.matches})}</Text>{row(t('unknownResults'),data.results.unknown,'unknown-pair')}</View>
    {data.matches===0&&<Text style={styles.text}>{t('empty')}</Text>}
    {(!query.mode||query.mode==='COMPETITIVE')&&<View style={styles.section}>
     <Text style={styles.title} accessibilityRole="header">{t('modes.COMPETITIVE')}</Text>
     {row(t('myWins'),data.results.myWins,'my-win','COMPETITIVE')}{row(t('theirWins',{name:data.friendName}),data.results.friendWins,'friend-win','COMPETITIVE')}
     {row(t('sharedWins'),data.results.sharedWins,'shared-win','COMPETITIVE')}{row(t('draws'),data.results.draws,'pair-draw','COMPETITIVE')}
     {row(t('drawsTogether'),data.results.drawsTogether,'draw-together','COMPETITIVE')}{row(t('otherWins'),data.results.otherWins,'other-win','COMPETITIVE')}
     {data.results.otherSharedWins>0&&row(t('otherSharedWins'),data.results.otherSharedWins,'other-shared-win','COMPETITIVE')}
     {data.results.otherDraws>0&&row(t('otherDraws'),data.results.otherDraws,'other-draw','COMPETITIVE')}
     <Text style={styles.muted}>{t('sharedWinNote')}</Text>
    </View>}
    {(!query.mode||query.mode==='COOPERATIVE')&&<View style={styles.section}>
     <Text style={styles.title} accessibilityRole="header">{t('modes.COOPERATIVE')} · {t('teamResult')}</Text>
     {row(t('wins'),data.results.teamWins,'team-win','COOPERATIVE')}{row(t('losses'),data.results.teamLosses,'team-loss','COOPERATIVE')}{row(t('draws'),data.results.teamDraws,'team-draw','COOPERATIVE')}
    </View>}
    <View style={styles.section}><Text style={styles.title} accessibilityRole="header">{t('mostPlayedTogether')}</Text>
     {data.games.map(g=><TouchableOpacity key={g.gameId} style={styles.gameRow} accessibilityRole="button" accessibilityLabel={g.name} onPress={()=>show('pair-all',{gameId:g.gameId})}><GameCover uri={g.imageUrl} style={styles.cover}/><View style={styles.grow}><Text style={styles.gameName}>{g.name}</Text><Text style={styles.muted}>{t('matchCount',{count:g.matches})}</Text></View><Text style={styles.link}>›</Text></TouchableOpacity>)}
    </View>
    <View style={styles.section}><Text style={styles.title} accessibilityRole="header">{t('resultEvolution')}</Text>
     {data.evolution.filter(b=>b.matches>0).map(b=><TouchableOpacity key={b.key} style={styles.inlineAction} accessibilityRole="button" accessibilityLabel={`${b.key}: ${b.matches}`} onPress={()=>show('pair-all',{bucket:b.key})}><View style={styles.grow}><Text style={styles.text}>{b.key} · {t('matchCount',{count:b.matches})}</Text><Text style={styles.muted}>{t('pairEvolution',{mine:b.results.myWins,friend:b.results.friendWins,draws:b.results.draws})}</Text><Text style={styles.muted}>{t('pairSample',{known:b.results.known,total:b.matches})}</Text>{b.results.teamWins+b.results.teamLosses+b.results.teamDraws>0&&<Text style={styles.muted}>{t('teamEvolution',{wins:b.results.teamWins,losses:b.results.teamLosses,draws:b.results.teamDraws})}</Text>}</View><Text style={styles.link}>›</Text></TouchableOpacity>)}
    </View>
    <View style={styles.section}><Text style={styles.title} accessibilityRole="header">{t('scoreComparison')}</Text><Text style={styles.muted}>{t('scoreDirectionNote')}</Text>
     {data.comparisons.map(g=><View key={g.gameId+g.mode} style={styles.section}><Text style={styles.gameName}>{g.name} · {t(`modes.${g.mode}`)}</Text><Text style={styles.muted}>{t('pairedScoreSample',{known:g.completeScores,total:g.matches})}</Text>
      {g.scores.slice(-5).map(s=><TouchableOpacity key={s.matchId} style={styles.inlineAction} accessibilityRole="button" onPress={()=>router.push({pathname:'/games/matches/[id]',params:{id:s.matchId}})}><View style={styles.grow}><Text style={styles.muted}>{date(s.date)}</Text><Text style={styles.text}>{t('me')}: {num(s.mine)} · {data.friendName}: {num(s.friend)}</Text></View><Text style={styles.link}>›</Text></TouchableOpacity>)}
      <TouchableOpacity style={styles.inlineAction} accessibilityRole="button" onPress={()=>show('pair-all',{gameId:g.gameId,mode:g.mode})}><Text style={styles.link}>{t('viewMatches')} ›</Text></TouchableOpacity>
     </View>)}
    </View>
   </>}
   <View style={styles.section}><Text style={styles.title} accessibilityRole="header">{t('frequentCompany')}</Text><Text style={styles.muted}>{t('companyScope')}</Text>
    {data.companions.filter(c=>c.matches>0).map(c=><TouchableOpacity key={c.friendId} style={styles.inlineAction} accessibilityRole="button" accessibilityLabel={t('selectFriend',{name:c.name})} onPress={()=>selectFriend(c.friendId)}><Text style={[styles.text,styles.grow]}>{c.name}</Text><Text style={styles.inlineValue}>{c.matches}</Text><Text style={styles.link}>›</Text></TouchableOpacity>)}
    {data.companions.every(c=>c.matches===0)&&<Text style={styles.muted}>{t('noCompany')}</Text>}
   </View>
  </>}
  <TouchableOpacity style={styles.inlineAction} accessibilityRole="button" accessibilityState={{expanded:notes}} onPress={()=>setNotes(v=>!v)}><Text style={styles.link}>{t('howCalculated')} ⌄</Text></TouchableOpacity>
  {notes&&<View style={styles.stack}><Text style={styles.text}>{t('companyPrivacy')}</Text><Text style={styles.text}>{t('pairDrawNote')}</Text><Text style={styles.muted}>{t('timeZone',{zone:query.timeZone})}</Text></View>}
 </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
