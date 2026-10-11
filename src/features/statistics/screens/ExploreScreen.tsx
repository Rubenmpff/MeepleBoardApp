import {useStatisticsWorkspace} from '../Workspace';
import {useState} from 'react';
import {ActivityIndicator,KeyboardAvoidingView,Platform,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import AreaHeader from '../summary/AreaHeader';
import ExploreFilters from '../ExploreFilters';
import useRouteQuery from '../useRouteQuery';
import useReport from '../hooks/useReport';
import useStatistics from '../hooks/useStatistics';
import service from '../services/statisticsService';
import {ExploreGame,ExploreReport,Metric,Mode,Period} from '../types';
import GameCover from '@/src/components/ui/GameCover';
import ScreenScroll from '../ui/Screen';
import {formatBucket} from '../utils/presentation';
import Sheet from '../ui/Sheet';
import {Button,Card,Disclosure,Glyph,Hero,Note,ResultsTrio,Row,Section,Segmented} from '../ui/components';
import {colors,space,strong,touch,type} from '../ui/theme';
type Tab='games'|'ratings'|'collection';
export default function ExploreScreen(){
 const workspace=useStatisticsWorkspace();
 const {query,setQuery,period,value}=useRouteQuery();const [section,setSection]=useState<Tab>((value('section') as Tab)||'games');const router=useRouter();const {t,i18n}=useTranslation('statistics');
 const [sort,setSort]=useState(section==='ratings'?'rating':'frequency');
 const [expanded,setExpanded]=useState<Record<string,boolean>>({}),[sortOpen,setSortOpen]=useState(false),[localPeriod,setLocalPeriod]=useState<Period>(period);
 const activePeriod=workspace?.period??localPeriod,setActivePeriod=workspace?.setPeriod??setLocalPeriod;
 const report=useReport<ExploreReport>(JSON.stringify({kind:'explore',query}),signal=>service.explore(query,signal));const summary=useStatistics(query);const data=report.data;
 const num=(n:number|null)=>n==null?'—':new Intl.NumberFormat(i18n.language,{maximumFractionDigits:2}).format(n);
 const show=(metric:Metric,extra:{gameId?:string;mode?:Mode;scoreValue?:number;bucket?:string}={})=>router.push({pathname:'/statistics/matches',params:{...query,...extra,metric}} as never);
 const games=[...(data?.games??[])].sort((a,b)=>sort==='wins'?b.results.wins-a.results.wins:sort==='rate'?(b.results.winRate??-1)-(a.results.winRate??-1):sort==='rating'?(b.averageRating??-1)-(a.averageRating??-1):b.matches-a.matches);
 const totals=new Map<string,number>();for(const g of games)totals.set(g.gameId,(totals.get(g.gameId)??0)+g.matches);
 if(sort==='frequency')games.sort((a,b)=>(totals.get(b.gameId)??0)-(totals.get(a.gameId)??0)||a.gameId.localeCompare(b.gameId));
 const ids=[...new Map(games.map(g=>[g.gameId,g])).keys()];
 const filterGames=[...new Map([...(summary.data?.gameOptions??[]),...(section==='collection'?(data?.collection??[]).map(l=>({gameId:l.gameId,name:l.name,imageUrl:l.imageUrl,matches:l.matchesInPeriod})):[])].map(g=>[g.gameId,g])).values()];
 const sorts=section==='ratings'?['rating','frequency']:['frequency','wins','rate'];
 const toggle=(gameId:string)=>setExpanded(v=>({...v,[gameId]:!v[gameId]}));
 const cover=(uri:string|null)=><GameCover uri={uri} style={s.cover} iconSize={22}/>;
 const tile=(label:string,amount:number|null,action:()=>void,suffix='')=><TouchableOpacity key={label} style={s.tile} accessibilityRole="button" accessibilityLabel={`${label}: ${num(amount)}`} accessibilityHint={t('viewSupporting')} onPress={action}>
  <Text style={type.caption}>{label}</Text><Text style={[type.head,s.numeric]}>{amount==null?'—':`${num(amount)}${suffix}`}</Text>
 </TouchableOpacity>;
 const modeBlock=(g:ExploreGame,multi:boolean)=><View key={g.mode} style={s.modeBlock}>
  {multi&&<Text style={[type.body,strong]} accessibilityRole="header">{t(`modes.${g.mode}`)} · {t('matchCount',{count:g.matches})}</Text>}
  {section==='ratings'?<Row first title={t('averageRating')} subtitle={t('ratingCoverage',{known:g.rated,total:g.matches})} value={num(g.averageRating)} accessibilityLabel={`${t('averageRating')}: ${num(g.averageRating)}`} onPress={()=>show('ratings',{gameId:g.gameId,mode:g.mode})}/>:<>
   <ResultsTrio items={[
    {icon:'trophy',color:colors.primary,value:num(g.results.wins),label:t('wins'),accessibilityLabel:`${t('wins')}: ${num(g.results.wins)}`,onPress:()=>show('wins',{gameId:g.gameId,mode:g.mode})},
    {icon:'close-thick',color:colors.loss,value:num(g.results.losses),label:t('losses'),accessibilityLabel:`${t('losses')}: ${num(g.results.losses)}`,onPress:()=>show('losses',{gameId:g.gameId,mode:g.mode})},
    {icon:'handshake',color:colors.draw,value:num(g.results.draws),label:t('draws'),accessibilityLabel:`${t('draws')}: ${num(g.results.draws)}`,onPress:()=>show('draws',{gameId:g.gameId,mode:g.mode})},
   ]}/>
   <View style={s.tiles}>
    {tile(t('winRate'),g.results.winRate,()=>show('known',{gameId:g.gameId,mode:g.mode}),'%')}
    {tile(t('withoutResultShort'),g.results.withoutResult,()=>show('undefined',{gameId:g.gameId,mode:g.mode}))}
    {tile(t('minimumScore'),g.minimum,()=>show('scores',{gameId:g.gameId,mode:g.mode,...(g.minimum==null?{}:{scoreValue:g.minimum})}))}
    {tile(t('maximumScore'),g.maximum,()=>show('scores',{gameId:g.gameId,mode:g.mode,...(g.maximum==null?{}:{scoreValue:g.maximum})}))}
   </View>
   <View style={s.captions}>
    <Note>{t('scoreSampleKnown',{scored:g.scored,total:g.matches,known:g.results.known})}</Note>
    <Note>{t('firstRecorded',{date:new Intl.DateTimeFormat(i18n.language,{dateStyle:'medium',timeZone:query.timeZone}).format(new Date(g.firstRecorded))})}</Note>
   </View>
  </>}
  <TouchableOpacity style={s.link} accessibilityRole="button" accessibilityLabel={t('viewMatches')} onPress={()=>show(section==='ratings'?'ratings':'all',{gameId:g.gameId,mode:g.mode})}>
   <Text style={[type.body,strong,s.flex,{color:colors.primary}]}>{t('viewMatches')}</Text><Glyph name="chevron-right" color={colors.primary}/>
  </TouchableOpacity>
 </View>;
 const ratedAny=(data?.games??[]).some(g=>g.rated>0);
 return <SafeAreaView style={s.screen} edges={workspace?[]:['top','left','right']}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScreenScroll>
  <View><AreaHeader area="explore" query={query} period={activePeriod}/>
   <ExploreFilters query={query} onChange={setQuery} games={filterGames} initialPeriod={activePeriod} onPeriodChange={setActivePeriod}/>
  </View>
  <Segmented items={(['games','ratings','collection'] as Tab[]).map(key=>({key,label:t(key==='games'?'gamesTab':key==='ratings'?'ratingsSection':'collectionSection')}))} value={section}
   onChange={item=>{setSection(item);setSort(item==='ratings'?'rating':'frequency');setExpanded({});}}/>
  {report.busy&&<ActivityIndicator color={colors.primary}/>}
  {report.error&&<Card padded style={s.state}><Text style={type.body} accessibilityRole="alert">{t('error')}</Text><Button title={t('retry')} onPress={report.refresh}/></Card>}
  {data&&section!=='collection'&&<View style={s.group}>
   <View style={s.toolbar}>
    <Text style={[type.caption,s.flex]}>{t('gamesCount',{count:ids.length})}</Text>
    <TouchableOpacity style={s.sort} accessibilityRole="button" accessibilityLabel={`${t('sortBy')}: ${t(`sort.${sort}`)}`} accessibilityState={{expanded:sortOpen}} onPress={()=>setSortOpen(true)}>
     <Glyph name="sort-variant" size={18} color={colors.primary}/><Text style={[type.body,strong,{color:colors.primary}]}>{t(`sort.${sort}`)}</Text><Glyph name="chevron-down" size={18} color={colors.primary}/>
    </TouchableOpacity>
   </View>
   {section==='ratings'&&!ratedAny&&<Card padded style={s.notice}><Glyph name="star-outline" size={24} color={colors.gold}/><View style={s.flex}><Text style={[type.body,strong]}>{t('noRatingsTitle')}</Text><Note>{t('noRatingsHint')}</Note></View></Card>}
   {ids.length===0?<Card padded><Text style={[type.body,{color:colors.muted}]}>{t('empty')}</Text></Card>:<Card>
    {ids.map((gameId,index)=>{
     const modes=games.filter(g=>g.gameId===gameId),first=modes[0],total=modes.reduce((sum,g)=>sum+g.matches,0),open=!!expanded[gameId];
     const rated=modes.reduce((sum,g)=>sum+g.rated,0);
     const subtitle=section==='ratings'?t('ratingCoverage',{known:rated,total}):t('matchesWithMode',{count:t('matchCount',{count:total}),modes:modes.map(g=>t(`modes.${g.mode}`)).join(', ')});
     return <View key={gameId}>
      <Row first={index===0} inset={72} lead={cover(first.imageUrl)} title={first.name} strongTitle subtitle={subtitle} value={section==='ratings'&&modes.length===1?num(first.averageRating):undefined}
       end={open?'collapse':'expand'} accessibilityLabel={first.name} onPress={()=>toggle(gameId)}/>
      {open&&<View style={s.expanded}>
       {modes.map(g=>modeBlock(g,modes.length>1))}
       {modes.length>1&&<Row title={t('viewGameMatches')} tone="link" onPress={()=>show(section==='ratings'?'ratings':'all',{gameId})}/>}
      </View>}
     </View>;
    })}
   </Card>}
  </View>}
  {data&&section==='ratings'&&<Section title={t('overPeriod')}><Card>
   <Disclosure flush first title={t('ratingEvolution')}>
    {data.ratings.map((b,i)=><Row key={b.key} first={i===0} title={formatBucket(b.key,i18n.language)} subtitle={t('ratedSample',{count:b.rated})} value={num(b.average)} accessibilityLabel={`${b.key}: ${num(b.average)}`} onPress={()=>show('ratings',{bucket:b.key})}/>)}
   </Disclosure>
  </Card></Section>}
  {data&&section==='collection'&&<View style={s.group}>
   <Hero style={s.collectionHero}>
    <View style={s.heroStat}><Text style={type.caption}>{t('collectionAdded')}</Text><Text style={type.title}>{num(data.collection.length)}</Text></View>
    <View style={s.heroStat}><Text style={type.caption}>{t('collectionPriced')}</Text><Text style={type.title}>{num(data.collection.filter(l=>l.pricePaid!=null).length)} <Text style={type.caption}>{t('collectionOf',{total:data.collection.length})}</Text></Text></View>
    <View style={s.heroStat}><Text style={type.caption}>{t('collectionOwnedIdle')}</Text><Text style={type.title}>{num(data.collection.filter(l=>l.status==='Owned'&&!l.hasRecordedMatch).length)}</Text></View>
   </Hero>
   <Note inset>{t('collectionScope')}</Note>
   {data.collection.length===0?<Card padded><Text style={[type.body,{color:colors.muted}]}>{t('emptyCollection')}</Text></Card>:<Card>
    {data.collection.map((l,index)=><View key={l.entryId} style={s.entry}>
     {index>0&&<View style={s.entryLine}/>}
     <TouchableOpacity style={s.entryMain} accessibilityRole="button" accessibilityLabel={l.name} onPress={()=>router.push({pathname:'/games/details/[id]',params:{id:l.gameId}})}>
      {cover(l.imageUrl)}
      <View style={s.flex}>
       <Text style={[type.body,strong]}>{l.name}</Text>
       <View style={s.pills}><View style={[s.pill,l.status==='Owned'?s.owned:l.status==='Played'?s.played:s.wish]}><Text style={[s.pillText,{color:l.status==='Owned'?colors.primary:l.status==='Played'?'#5B4A80':'#6E4D00'}]}>{t(`libraryStatus.${l.status}`)}</Text></View>
        <Text style={type.caption}>{l.pricePaid==null?t('noPrice'):t('priceValue',{price:new Intl.NumberFormat(i18n.language,{minimumFractionDigits:2,maximumFractionDigits:2}).format(l.pricePaid)})}</Text></View>
       {!l.hasRecordedMatch&&<Text style={type.caption}>{t('noRecordedMatch')}</Text>}
      </View>
     </TouchableOpacity>
     <TouchableOpacity style={s.entryCount} accessibilityRole="button" accessibilityLabel={t('matchesInPeriodFor',{name:l.name,count:l.matchesInPeriod})} accessibilityHint={t('viewSupporting')} onPress={()=>show('all',{gameId:l.gameId})}>
      <Text style={s.count}>{num(l.matchesInPeriod)}</Text><Glyph name="chevron-right"/>
     </TouchableOpacity>
    </View>)}
   </Card>}
   {data.collection.length>0&&<Note inset>{t('collectionHint')}</Note>}
  </View>}
  <Section title={t('moreDetails')}><Card><Disclosure first title={t('howCalculated')}>
   <Text style={type.body}>{section==='ratings'?t('ratingRule'):section==='collection'?t('collectionLimits'):t('scoreDirectionNote')}</Text><Note>{t('timeZone',{zone:query.timeZone})}</Note>
  </Disclosure></Card></Section>
 </ScreenScroll></KeyboardAvoidingView>
 <Sheet visible={sortOpen} title={t('sortTitle')} closeLabel={t('close')} onClose={()=>setSortOpen(false)} right={{label:t('close'),onPress:()=>setSortOpen(false)}}>
  <Card>{sorts.map((key,i)=><Row key={key} first={i===0} title={t(`sort.${key}`)} end="check" selected={key===sort} onPress={()=>{setSort(key);setSortOpen(false);}}/>)}</Card>
 </Sheet>
 </SafeAreaView>;
}

const s=StyleSheet.create({
 screen:{flex:1,backgroundColor:colors.background},
 flex:{flex:1,minWidth:0},
 numeric:{fontVariant:['tabular-nums']},
 group:{gap:space.md},
 state:{gap:space.md,alignItems:'flex-start'},
 toolbar:{flexDirection:'row',alignItems:'center',paddingLeft:space.lg,marginVertical:-space.sm},
 sort:{flexDirection:'row',alignItems:'center',gap:6,minHeight:touch,paddingHorizontal:space.md},
 notice:{flexDirection:'row',gap:space.md,alignItems:'flex-start'},
 cover:{width:44,height:44,borderRadius:10},
 expanded:{backgroundColor:colors.tint,borderTopWidth:1,borderTopColor:colors.hair},
 modeBlock:{paddingHorizontal:space.lg,paddingTop:space.md,gap:space.md},
 tiles:{flexDirection:'row',flexWrap:'wrap',gap:space.sm},
 tile:{flexGrow:1,flexBasis:'45%',minHeight:touch,backgroundColor:colors.card,borderWidth:1,borderColor:colors.line,borderRadius:space.md,paddingVertical:space.sm,paddingHorizontal:space.md},
 captions:{gap:2},
 link:{flexDirection:'row',alignItems:'center',minHeight:touch,gap:space.sm},
 collectionHero:{flexDirection:'row',flexWrap:'wrap',gap:space.md},
 heroStat:{flexGrow:1,flexBasis:96,minHeight:touch,gap:2,justifyContent:'space-between'},
 entry:{flexDirection:'row',alignItems:'center'},
 entryLine:{position:'absolute',top:0,left:72,right:0,height:1,backgroundColor:colors.hair},
 entryMain:{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:space.md,minHeight:60,paddingVertical:space.sm,paddingLeft:space.lg},
 entryCount:{flexDirection:'row',alignItems:'center',gap:4,minHeight:touch,minWidth:touch,paddingLeft:space.sm,paddingRight:space.lg,alignSelf:'stretch'},
 count:{fontSize:17,lineHeight:22,fontWeight:'600',color:colors.text,fontVariant:['tabular-nums']},
 pills:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:space.sm,marginTop:2},
 pill:{borderRadius:8,paddingHorizontal:8,paddingVertical:1},
 pillText:{fontSize:12,lineHeight:18,fontWeight:'600'},
 owned:{backgroundColor:colors.primarySoft},played:{backgroundColor:'#EEE9F6'},wish:{backgroundColor:'#FFF1D6'},
});
