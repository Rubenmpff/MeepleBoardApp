import { formatDate } from '@/src/ui/format';
import {useStatisticsWorkspace} from '../components/Workspace';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Keyboard,KeyboardAvoidingView,Platform,ScrollView,StyleSheet,Text,TouchableOpacity,View,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect,useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import AreaHeader from '../components/AreaHeader';
import ExploreFilters from '../components/ExploreFilters';
import useRouteQuery from '../hooks/useRouteQuery';
import useReport from '../hooks/useReport';
import useStatistics from '../hooks/useStatistics';
import service from '../services/statisticsService';
import {Companion,CompanyReport,Metric,Mode,Period,GroupContext} from '../types/Statistics';
import GameCover from '@/src/ui/GameCover';
import ScreenScroll from '@/src/ui/Screen';
import {formatBucket} from '../utils/presentation';
import Sheet from '@/src/ui/Sheet';
import {Avatar,Button,Card,Disclosure,Glyph,Hero,Note,PendingNotice,ProportionBar,RankBar,ResultsTrio,Row,SearchField,Section,Segmented} from '@/src/ui/components';
import {colors,isLarge,space,strong,touch,type} from '@/src/ui/theme';
export default function CompanyScreen(){
 const workspace=useStatisticsWorkspace();
 const {query,setQuery,period,value}=useRouteQuery();const router=useRouter();const {t,i18n}=useTranslation('statistics');const {width,height,fontScale}=useWindowDimensions();const large=isLarge(width,fontScale);
 const [friendId,setFriendId]=useState<string|undefined>(value('friendId')),[chooser,setChooser]=useState(false);
 const [search,setSearch]=useState(''),[localPeriod,setLocalPeriod]=useState<Period>(period);
 const activePeriod=workspace?.period??localPeriod,setActivePeriod=workspace?.setPeriod??setLocalPeriod;
 const [groupContext,setGroupContext]=useState<GroupContext>((value('groupContext') as GroupContext)||'all');
 const [friendSearch,setFriendSearch]=useState('');
 const report=useReport<CompanyReport>(JSON.stringify({kind:'company',query,friendId,groupContext}),signal=>service.company(query,friendId,signal,groupContext));
 const summary=useStatistics(query);const data=report.data;const scroll=useRef<ScrollView|null>(null);
 const listScroll=useRef(0),restoreListScroll=useRef(false);
 // Names stay known while the next report loads, so the identity card never flickers.
 const names=useRef<Record<string,string>>({});
 for(const c of data?.companions??[])names.current[c.friendId]=c.name;
 if(data?.friendId&&data.friendName)names.current[data.friendId]=data.friendName;
 const friendName=(friendId&&(data?.friendId===friendId?data.friendName:null))||(friendId&&names.current[friendId])||t('unavailable');
 const backToList=useCallback(()=>{setFriendId(undefined);setChooser(false);restoreListScroll.current=true;},[]);
 useFocusEffect(useCallback(()=>{if(!workspace)return;workspace.companyBack.current=friendId?backToList:null;return()=>{workspace.companyBack.current=null;};},[workspace,friendId,backToList]));
 const restoreScroll=()=>{if(!friendId&&!report.busy&&restoreListScroll.current){scroll.current?.scrollTo({y:listScroll.current,animated:false});restoreListScroll.current=false;}};
 useEffect(()=>{if(friendId||report.busy||!data||!restoreListScroll.current)return;const frame=requestAnimationFrame(restoreScroll);return()=>cancelAnimationFrame(frame);},[friendId,report.busy,data]);
 const closeChooser=()=>{setChooser(false);Keyboard.dismiss();};
 const selectFriend=(id:string)=>{closeChooser();if(id!==friendId){setFriendId(id);scroll.current?.scrollTo({y:0,animated:false});}};
 const matching=(term:string)=>(data?.companions??[]).filter(c=>c.name.toLocaleLowerCase(i18n.language).includes(term.trim().toLocaleLowerCase(i18n.language)));
 const top=Math.max(1,...(data?.companions??[]).map(c=>c.matches));
 const friendRow=(c:Companion,index:number,inSheet:boolean)=><Row key={c.friendId} first={index===0} inset={68} lead={<Avatar name={c.name}/>} title={c.name||t('unavailable')} strongTitle
  subtitle={inSheet&&c.friendId===friendId?`${t('matchCount',{count:c.matches})} · ${t('currentFriend')}`:t('matchCount',{count:c.matches})}
  detail={inSheet?undefined:<RankBar value={c.matches} max={top}/>} end={inSheet?'check':'chevron'} selected={c.friendId===friendId}
  accessibilityLabel={t('selectFriend',{name:c.name})} onPress={()=>selectFriend(c.friendId)}/>;
 const num=(n:number|null)=>n==null?'—':new Intl.NumberFormat(i18n.language,{maximumFractionDigits:2}).format(n);
 const show=(metric:Metric,extra:{gameId?:string;mode?:Mode;bucket?:string}={})=>router.push({pathname:'/statistics/matches',params:{...query,...extra,friendId,groupContext,metric}} as never);
 const metricRow=(title:string,label:string,n:number,metric:Metric,first=false)=><Row key={metric} first={first} title={title} value={num(n)} accessibilityLabel={`${label}: ${n}`} accessibilityHint={t('viewSupporting')} onPress={()=>show(metric,{mode:'COMPETITIVE'})}/>;
 const date=(iso:string)=>formatDate(iso,i18n.language,query.timeZone);
 const calculation=<Disclosure first title={t('howCalculated')}>
  <Text style={type.body}>{t('companyPrivacy')}</Text><Text style={type.caption}>{t('registeredParticipantsNote')}</Text><Text style={type.body}>{t('pairDrawNote')}</Text><Text style={type.caption}>{t('timeZone',{zone:query.timeZone})}</Text>
 </Disclosure>;
 const day=(iso:string)=>formatDate(`${iso}T12:00:00Z`,i18n.language,'UTC');
 const r=data?.results;
 const known=r?.known??0;
 return <SafeAreaView style={s.screen} edges={workspace?[]:['top','left','right']}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
 <ScreenScroll ref={scroll} scrollEventThrottle={16} onScroll={event=>{if(!friendId&&!restoreListScroll.current)listScroll.current=event.nativeEvent.contentOffset.y;}} onContentSizeChange={restoreScroll}>
  <View style={s.group}>
   <AreaHeader onBack={friendId?backToList:undefined} area="company" query={query} period={activePeriod}/>
   {friendId&&<TouchableOpacity style={s.identity} accessibilityRole="button" accessibilityLabel={t('changeFriend')} accessibilityValue={{text:t('youAnd',{name:friendName})}} accessibilityState={{expanded:chooser}} onPress={()=>{setFriendSearch('');setChooser(true);}}>
    <Avatar name={friendName} size={44}/>
    <View style={s.flex}><Text style={type.caption}>{t('youAndLabel')}</Text><Text style={[type.head,{fontWeight:'700'}]}>{friendName}</Text></View>
    <View style={s.swap}><Glyph name="swap-horizontal" size={20} color={colors.primary}/><Text style={[type.body,strong,{color:colors.primary}]}>{t('switchFriend')}</Text></View>
   </TouchableOpacity>}
   <ExploreFilters query={query} onChange={setQuery} games={summary.data?.gameOptions??[]} initialPeriod={activePeriod} onPeriodChange={setActivePeriod}/>
   {/* From a game page whose first match is older than the 10-year limit: say what is left out, while that period is in use. */}
   {!!value('historyFrom')&&query.start===value('start')&&query.gameId===value('gameId')&&<View style={s.limited} accessibilityRole="alert">
    <Glyph name="information-outline" size={18} color={colors.pendingIcon}/>
    <Text style={[type.body,s.flex,{color:colors.pendingText}]}>{t('historyLimited',{game:value('gameName')??'',first:day(value('historyFrom')!),from:day(query.start)})}</Text>
   </View>}
  </View>

  {report.busy&&<ActivityIndicator color={colors.primary}/>}
  {report.error&&<Card padded style={s.state}><Text style={type.body} accessibilityRole="alert">{t('error')}</Text><Button title={t('retry')} onPress={report.refresh}/></Card>}
  {data&&!friendId&&<>
   <Section title={t('playedWith')} note={t('friendsCount',{count:data.companions.length})}>
    <View style={s.group}>
     {data.companions.length>0&&<SearchField value={search} onChangeText={setSearch} placeholder={t('searchFriend')}/>}
     <Card>
      {matching(search).map((c,i)=>friendRow(c,i,false))}
      {data.companions.length===0&&<Text style={[type.body,s.message]}>{t('noCompany')}</Text>}
      {data.companions.length>0&&matching(search).length===0&&<Text style={[type.body,s.message]}>{t('noFriendFound')}</Text>}
     </Card>
    </View>
    <Note inset>{t('companyScope')}</Note>
   </Section>
   <Section title={t('moreDetails')}><Card>{calculation}</Card></Section>
  </>}
  {data&&friendId&&r&&<>
   <View style={s.group}>
    <Segmented items={(['all','only-two','group'] as GroupContext[]).map(key=>({key,label:t(`groupContexts.${key}`),count:String(data.contextCounts?.[key==='only-two'?'onlyTwo':key]??'—')}))} value={groupContext} onChange={setGroupContext}/>
    {!!data.contextCounts?.unclassified&&<Note inset>{t('unclassifiedContext',{count:data.contextCounts.unclassified})}</Note>}
   </View>

   <Hero>
    <TouchableOpacity style={s.total} accessibilityRole="button" accessibilityLabel={`${t('jointMatches')}: ${data.matches}`} accessibilityHint={t('viewSupporting')} onPress={()=>show('pair-all')}>
     <View style={s.label}><Glyph name="account-group" size={16} color={colors.icon}/><Text style={type.caption}>{t('jointMatches')}</Text></View>
     <Text style={type.display}>{num(data.matches)}</Text>
     <Text style={type.caption}>{data.matches===0?t('empty'):known>0?t('pairConfirmedOf',{known,total:data.matches}):t('pairNoneConfirmed')}</Text>
    </TouchableOpacity>
    {known>0&&<ProportionBar parts={[{value:known,color:colors.primary},{value:r.unknown,color:'#DCD2EC'}]}/>}
    {known>0&&r.unknown>0&&<PendingNotice label={t('pairPendingCount',{count:r.unknown})} accessibilityLabel={`${t('pairPending')}: ${r.unknown}`} onPress={()=>show('unknown-pair')}/>}
   </Hero>

   {data.matches>0&&known===0&&<Card padded style={s.pendingCard}>
    <Glyph name="help-circle-outline" size={24} color={colors.pendingIcon}/>
    <Text style={type.head} accessibilityRole="header">{t('pairPendingTitle')}</Text>
    <Text style={type.body}>{t('pairPendingMessage',{count:data.matches})}</Text>
    <Button style={s.whiteButton} title={t('viewPendingPair',{count:r.unknown})} accessibilityLabel={`${t('pairPending')}: ${r.unknown}`} onPress={()=>show('unknown-pair')}/>
   </Card>}

   {known>0&&(!query.mode||query.mode==='COMPETITIVE')&&<Section title={t('modes.COMPETITIVE')} note={t('individualResult')}>
    <Card>
     <View style={s.duel}>
      <View style={[s.sides,large&&s.sidesLarge]}>
       <TouchableOpacity style={[s.side,large&&s.sideLarge]} accessibilityRole="button" accessibilityLabel={`${t('myWins')}: ${r.myWins}`} accessibilityHint={t('viewSupporting')} onPress={()=>show('my-win',{mode:'COMPETITIVE'})}>
        <Text style={type.caption}>{t('you')}</Text><Text style={[type.display,{color:colors.primary}]}>{num(r.myWins)}</Text><Text style={type.caption}>{t('winsWord',{count:r.myWins})}</Text>
       </TouchableOpacity>
       <TouchableOpacity style={[s.side,large?s.sideLarge:s.sideRight]} accessibilityRole="button" accessibilityLabel={`${t('theirWins',{name:friendName})}: ${r.friendWins}`} accessibilityHint={t('viewSupporting')} onPress={()=>show('friend-win',{mode:'COMPETITIVE'})}>
        <Text style={[type.caption,!large&&s.right]}>{friendName}</Text><Text style={[type.display,{color:colors.friend}]}>{num(r.friendWins)}</Text><Text style={type.caption}>{t('winsWord',{count:r.friendWins})}</Text>
       </TouchableOpacity>
      </View>
      <ProportionBar height={10} parts={[{value:r.myOnlyWins,color:colors.primary},{value:r.sharedWins,color:colors.shared},{value:r.friendOnlyWins,color:colors.friend}]}/>
      <Text style={type.caption}>{t('winSplit',{mine:r.myOnlyWins,shared:r.sharedWins,friend:r.friendOnlyWins,name:friendName})}</Text>
     </View>
     {metricRow(t('sharedWinsShort'),t('sharedWins'),r.sharedWins,'shared-win')}
     {metricRow(t('pairDrawsShort'),t('pairDraws'),r.draws,'pair-draw')}
     {metricRow(t('otherWinsShort'),t('otherWins'),r.otherWins,'other-win')}
     {r.sharedWins>0&&<View style={s.cardNote}><Note>{t('sharedWinsCompact',{count:r.sharedWins})}</Note></View>}
     <Disclosure flush title={t('pairBreakdown')}>
      <View style={s.cardNote}><Note>{t('pairDrawExplanation')}</Note></View>
      {metricRow(t('drawsTogether'),t('drawsTogether'),r.drawsTogether,'draw-together',true)}
      {metricRow(t('drawWithOther'),t('drawWithOther'),r.draws-r.drawsTogether,'draw-with-other')}
      {r.otherSharedWins>0&&metricRow(t('otherSharedWins'),t('otherSharedWins'),r.otherSharedWins,'other-shared-win')}
      {r.otherDraws>0&&metricRow(t('otherDraws'),t('otherDraws'),r.otherDraws,'other-draw')}
      <View style={s.cardNote}><Note>{t('sharedWinNote')}</Note></View>
     </Disclosure>
    </Card>
   </Section>}

   {known>0&&(!query.mode||query.mode==='COOPERATIVE')&&<Section title={t('modes.COOPERATIVE')} note={t('teamResult')}>
    <Card padded><ResultsTrio items={[
     {icon:'trophy',color:colors.primary,value:num(r.teamWins),label:t('wins'),accessibilityLabel:`${t('metrics.team-win')}: ${r.teamWins}`,onPress:()=>show('team-win',{mode:'COOPERATIVE'})},
     {icon:'close-thick',color:colors.loss,value:num(r.teamLosses),label:t('losses'),accessibilityLabel:`${t('metrics.team-loss')}: ${r.teamLosses}`,onPress:()=>show('team-loss',{mode:'COOPERATIVE'})},
     {icon:'handshake',color:colors.draw,value:num(r.teamDraws),label:t('draws'),accessibilityLabel:`${t('metrics.team-draw')}: ${r.teamDraws}`,onPress:()=>show('team-draw',{mode:'COOPERATIVE'})},
    ]}/></Card>
   </Section>}

   <Section title={t('aboutUs')}>
    <Card>
     <Row first title={t('viewPairMatches',{count:data.matches})} accessibilityLabel={t('viewMatches')} onPress={()=>show('pair-all')}/>
     <Disclosure flush title={t('mostPlayedTogether')}>
      {data.games.map((g,i)=><Row key={g.gameId} first={i===0} inset={72} lead={<GameCover uri={g.imageUrl} style={s.cover} iconSize={22}/>} title={g.name} value={num(g.matches)} accessibilityLabel={g.name} onPress={()=>show('pair-all',{gameId:g.gameId})}/>)}
     </Disclosure>
     <Disclosure flush title={t('resultEvolution')}>
      {data.evolution.filter(b=>b.matches>0).map((b,i)=><Row key={b.key} first={i===0} title={formatBucket(b.key,i18n.language)} value={num(b.matches)} accessibilityLabel={`${b.key}: ${b.matches}`} onPress={()=>show('pair-all',{bucket:b.key})}
       detail={<><Text style={type.caption}>{t('pairEvolution',{mine:b.results.myWins,friend:b.results.friendWins,draws:b.results.draws})}</Text><Text style={type.caption}>{t('pairSample',{known:b.results.known,total:b.matches})}</Text>{b.results.teamWins+b.results.teamLosses+b.results.teamDraws>0&&<Text style={type.caption}>{t('teamEvolution',{wins:b.results.teamWins,losses:b.results.teamLosses,draws:b.results.teamDraws})}</Text>}</>}/>)}
     </Disclosure>
     <Disclosure flush title={t('scoreComparison')}>
      <View style={s.cardNote}><Note>{t('scoreDirectionNote')}</Note></View>
      {data.comparisons.map(g=><View key={g.gameId+g.mode} style={s.comparison}>
       <View style={s.cardNote}><Text style={[type.body,strong]}>{g.name} · {t(`modes.${g.mode}`)}</Text><Note>{t('pairedScoreSample',{known:g.completeScores,total:g.matches})}</Note></View>
       {g.scores.slice(-5).map((sc,i)=><Row key={sc.matchId} first={i===0} title={`${t('me')}: ${num(sc.mine)} · ${friendName}: ${num(sc.friend)}`} subtitle={date(sc.date)} onPress={()=>router.push({pathname:'/games/matches/[id]',params:{id:sc.matchId}})}/>)}
       <Row title={t('viewMatches')} tone="link" onPress={()=>show('pair-all',{gameId:g.gameId,mode:g.mode})}/>
      </View>)}
     </Disclosure>
     <Disclosure title={t('howCalculated')}>
      <Text style={type.body}>{t('companyPrivacy')}</Text><Text style={type.caption}>{t('registeredParticipantsNote')}</Text><Text style={type.body}>{t('pairDrawNote')}</Text><Text style={type.caption}>{t('timeZone',{zone:query.timeZone})}</Text>
     </Disclosure>
    </Card>
   </Section>
  </>}
 </ScreenScroll></KeyboardAvoidingView>
 {friendId&&<Sheet visible={chooser} minHeight={Math.min(440,height*0.55)} title={t('changeFriend')} closeLabel={t('closeFriendChooser')} onClose={closeChooser} right={{label:t('close'),accessibilityLabel:t('closeFriendChooser'),onPress:closeChooser}}>
  <SearchField value={friendSearch} onChangeText={setFriendSearch} placeholder={t('searchFriend')}/>
  <Card>
   {matching(friendSearch).map((c,i)=>friendRow(c,i,true))}
   {!!data&&matching(friendSearch).length===0&&<Text style={[type.body,s.message]}>{t('noFriendFound')}</Text>}
  </Card>
  <Note inset>{t('friendSheetNote')}</Note>
 </Sheet>}
 </SafeAreaView>;
}

const s=StyleSheet.create({
 limited:{flexDirection:"row",alignItems:"flex-start",gap:10,padding:space.md,borderRadius:14,borderWidth:1,borderColor:colors.pendingLine,backgroundColor:colors.pendingSoft},
 screen:{flex:1,backgroundColor:colors.background},
 flex:{flex:1,minWidth:0},
 group:{gap:space.md},
 state:{gap:space.md,alignItems:'flex-start'},
 identity:{flexDirection:'row',alignItems:'center',gap:space.md,minHeight:64,paddingVertical:space.sm,paddingHorizontal:space.lg,backgroundColor:colors.card,borderWidth:1,borderColor:colors.line,borderRadius:14,borderCurve:'continuous'},
 swap:{flexDirection:'row',alignItems:'center',gap:4,minHeight:touch},
 message:{padding:space.lg,color:colors.muted},
 total:{gap:2,minHeight:touch},
 label:{flexDirection:'row',alignItems:'center',gap:6},
 pendingCard:{backgroundColor:colors.pendingSoft,borderColor:colors.pendingLine,gap:space.sm},
 whiteButton:{backgroundColor:colors.card,marginTop:4},
 duel:{padding:space.lg,paddingBottom:space.md,gap:space.sm},
 sides:{flexDirection:'row',gap:space.lg,alignItems:'flex-end'},
 sidesLarge:{flexDirection:'column',alignItems:'stretch',gap:space.sm},
 side:{flex:1,minWidth:0,minHeight:touch},
 sideLarge:{flex:0},
 sideRight:{alignItems:'flex-end'},
 right:{textAlign:'right'},
 cardNote:{paddingHorizontal:space.lg,paddingBottom:space.sm,gap:2},
 comparison:{paddingTop:space.md,borderTopWidth:1,borderTopColor:colors.hair},
 cover:{width:44,height:44,borderRadius:10},
});
