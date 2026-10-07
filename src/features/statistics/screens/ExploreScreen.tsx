import {useState} from 'react';
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
import {ExploreReport,Metric,Mode} from '../types';
import GameCover from '@/src/components/ui/GameCover';
import {APP_THEME as theme} from '@/src/styles/clubTheme';
import {styles} from '../styles';
export default function ExploreScreen(){
 const {query,setQuery,period,value}=useRouteQuery();const section=value('section')||'games';const router=useRouter();const {t,i18n}=useTranslation('statistics');
 const [sort,setSort]=useState(section==='ratings'?'rating':'frequency'),[notes,setNotes]=useState(false);
 const report=useReport<ExploreReport>(JSON.stringify({kind:'explore',query}),signal=>service.explore(query,signal));const summary=useStatistics(query);const data=report.data;
 const num=(n:number|null)=>n==null?'—':new Intl.NumberFormat(i18n.language,{maximumFractionDigits:2}).format(n);
 const show=(metric:Metric,extra:{gameId?:string;mode?:Mode;scoreValue?:number;bucket?:string}={})=>router.push({pathname:'/statistics/matches',params:{...query,...extra,metric}} as never);
 const row=(label:string,amount:number|null,action:()=>void,hint?:string)=><TouchableOpacity key={label} style={styles.inlineAction} accessibilityRole="button" accessibilityLabel={`${label}: ${num(amount)}`} onPress={action}><View style={styles.grow}><Text style={styles.text}>{label}</Text>{hint&&<Text style={styles.muted}>{hint}</Text>}</View><Text style={styles.inlineValue}>{num(amount)}</Text><Text style={styles.link}>›</Text></TouchableOpacity>;
 const games=[...(data?.games??[])].sort((a,b)=>sort==='wins'?b.results.wins-a.results.wins:sort==='rate'?(b.results.winRate??-1)-(a.results.winRate??-1):sort==='rating'?(b.averageRating??-1)-(a.averageRating??-1):b.matches-a.matches);
 const filterGames=[...new Map([...(summary.data?.gameOptions??[]),...(section==='collection'?(data?.collection??[]).map(l=>({gameId:l.gameId,name:l.name,imageUrl:l.imageUrl,matches:l.matchesInPeriod})):[])].map(g=>[g.gameId,g])).values()];
 const title=t(section==='ratings'?'ratingsSection':section==='collection'?'collectionSection':'gamesRecords');
 return <SafeAreaView style={styles.screen} edges={['top','left','right']}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
  <StatisticsHeader title={title} backLabel={t('back')} onBack={()=>router.canGoBack()?router.back():router.replace('/statistics')}/>
  <ExploreFilters query={query} onChange={setQuery} games={filterGames} initialPeriod={period}/>
  {report.busy&&<ActivityIndicator color={theme.colors.primary}/>}{report.error&&<TouchableOpacity style={styles.inlineAction} accessibilityRole="button" onPress={report.refresh}><Text style={styles.text} accessibilityRole="alert">{t('error')}</Text><Text style={styles.link}>{t('retry')}</Text></TouchableOpacity>}
  {data&&section!=='collection'&&<>
   <View style={styles.row}>{(section==='ratings'?['rating','frequency']:['frequency','wins','rate']).map(key=><TouchableOpacity key={key} style={[styles.period,key===sort&&styles.selected]} accessibilityRole="button" accessibilityState={{selected:key===sort}} onPress={()=>setSort(key)}><Text style={[styles.text,key===sort&&styles.selectedText]}>{t(`sort.${key}`)}</Text></TouchableOpacity>)}</View>
   {games.length===0&&<Text style={styles.text}>{t('empty')}</Text>}
   {games.map(g=><View key={g.gameId+g.mode} style={styles.section}>
    <TouchableOpacity style={styles.gameRow} accessibilityRole="button" accessibilityLabel={g.name} onPress={()=>show(section==='ratings'?'ratings':'all',{gameId:g.gameId,mode:g.mode})}><GameCover uri={g.imageUrl} style={styles.cover}/><View style={styles.grow}><Text style={styles.gameName}>{g.name}</Text><Text style={styles.muted}>{t(`modes.${g.mode}`)} · {t('matchCount',{count:g.matches})}</Text></View><Text style={styles.link}>›</Text></TouchableOpacity>
    {section==='ratings'?<>
     {row(t('averageRating'),g.averageRating,()=>show('ratings',{gameId:g.gameId,mode:g.mode}),t('ratingCoverage',{known:g.rated,total:g.matches}))}
    </>:<>
     {row(t('wins'),g.results.wins,()=>show('wins',{gameId:g.gameId,mode:g.mode}))}
     {row(t('winRate'),g.results.winRate,()=>show('known',{gameId:g.gameId,mode:g.mode}),t('knownResults',{count:g.results.known}))}
     {g.results.withoutResult>0&&row(t('unknownResults'),g.results.withoutResult,()=>show('undefined',{gameId:g.gameId,mode:g.mode}))}
     <Text style={styles.muted}>{t('scoreSample',{known:g.scored,total:g.matches})}</Text>
     {row(t('minimumScore'),g.minimum,()=>show('scores',{gameId:g.gameId,mode:g.mode,...(g.minimum==null?{}:{scoreValue:g.minimum})}))}
     {row(t('maximumScore'),g.maximum,()=>show('scores',{gameId:g.gameId,mode:g.mode,...(g.maximum==null?{}:{scoreValue:g.maximum})}))}
     <Text style={styles.muted}>{t('firstRecorded',{date:new Intl.DateTimeFormat(i18n.language,{dateStyle:'medium',timeZone:query.timeZone}).format(new Date(g.firstRecorded))})}</Text>
    </>}
   </View>)}
   {section==='ratings'&&<View style={styles.section}><Text style={styles.title}>{t('ratingEvolution')}</Text>
    {data.ratings.map(b=>row(b.key,b.average,()=>show('ratings',{bucket:b.key}),t('ratedSample',{count:b.rated})))}
   </View>}
  </>}
  {data&&section==='collection'&&<>
   <Text style={styles.muted}>{t('collectionScope')}</Text>
   <View style={styles.summary}><Text style={styles.title}>{t('collectionEntries',{count:data.collection.length})}</Text><Text style={styles.text}>{t('pricesCoverage',{known:data.collection.filter(l=>l.pricePaid!=null).length,total:data.collection.length})}</Text><Text style={styles.text}>{t('ownedNotRecorded',{count:data.collection.filter(l=>l.status==='Owned'&&!l.hasRecordedMatch).length})}</Text></View>
   {data.collection.length===0&&<Text style={styles.text}>{t('emptyCollection')}</Text>}
   {data.collection.map(l=><View key={l.entryId} style={styles.section}>
    <TouchableOpacity style={styles.gameRow} accessibilityRole="button" accessibilityLabel={l.name} onPress={()=>router.push({pathname:'/games/details/[id]',params:{id:l.gameId}})}><GameCover uri={l.imageUrl} style={styles.cover}/><View style={styles.grow}><Text style={styles.gameName}>{l.name}</Text><Text style={styles.muted}>{t(`libraryStatus.${l.status}`)}</Text></View><Text style={styles.link}>›</Text></TouchableOpacity>
    <Text style={styles.text}>{l.pricePaid==null?t('noPrice'):t('registeredPrice',{price:new Intl.NumberFormat(i18n.language,{minimumFractionDigits:2,maximumFractionDigits:2}).format(l.pricePaid)})}</Text>
    <Text style={styles.muted}>{l.hasRecordedMatch?t('hasRecordedMatch'):t('noRecordedMatch')}</Text>
    {row(t('matchesInPeriod'),l.matchesInPeriod,()=>show('all',{gameId:l.gameId}))}
   </View>)}
  </>}
  <TouchableOpacity style={styles.inlineAction} accessibilityRole="button" accessibilityState={{expanded:notes}} onPress={()=>setNotes(v=>!v)}><Text style={styles.link}>{t('howCalculated')} ⌄</Text></TouchableOpacity>
  {notes&&<View style={styles.stack}><Text style={styles.text}>{section==='ratings'?t('ratingRule'):section==='collection'?t('collectionLimits'):t('scoreDirectionNote')}</Text><Text style={styles.muted}>{t('timeZone',{zone:query.timeZone})}</Text></View>}
 </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
