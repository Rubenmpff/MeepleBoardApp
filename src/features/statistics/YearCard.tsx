import {StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useTranslation} from 'react-i18next';
import GameCover from '@/src/ui/GameCover';
import YearDecoration from './YearDecoration';
import {publicYearCard,YearCardId} from './yearCards';
import {formatDuration} from './utils/presentation';
import {YearReport} from './types';
import {colors,isLarge,type} from '@/src/ui/theme';
// The same card is read in the app and captured for sharing; it never includes friends' identities.
// variant is kept for callers: reader and share render identically.
export default function YearCard({report,id}:{report:YearReport;id:YearCardId;variant?:'reader'|'share'}){
 const {width,fontScale}=useWindowDimensions();
 const card=publicYearCard(report,id);const {t,i18n}=useTranslation('statistics');const n=(v:number)=>new Intl.NumberFormat(i18n.language,{maximumFractionDigits:2}).format(v);
 const inner=Math.min(width-32,648)-32;
 const side=card.leaders.length>1&&!isLarge(width,fontScale);
 const cover=side?Math.min(132,(inner-16)/2):Math.min(fontScale>1.25?144:180,Math.max(112,inner*0.52));
 return <View style={s.card}>
  <YearDecoration/>
  <Text style={s.brand}>MeepleBoard · {card.year}</Text>
  {card.year===Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:card.timeZone}).format(new Date()))&&<Text style={s.note}>{t('toDate')}</Text>}
  <Text style={s.title} accessibilityRole="header">{t(`yearCards.${id}`)}</Text>
  {id==='overview'&&<><Text style={s.big}>{n(card.matches)}</Text><Text style={s.text}>{t('matchCount',{count:card.matches})} · {t('differentGamesCount',{count:card.games})}</Text></>}
  {['played','wins','rate','first'].includes(id)&&<>
   {card.leaders.length===0&&<Text style={s.text}>{t(id==='rate'?'rateInsufficient':id==='first'?'noFirstGames':'noYearHighlight',{minimum:card.minimumRateSample})}</Text>}
   <View style={[s.leaders,side&&s.leadersSide]}>{card.leaders.map(g=><View key={g.gameId+(g.mode??'')} style={[s.leader,side&&{width:(inner-16)/2}]}>
    <GameCover uri={g.imageUrl} style={{width:cover,height:cover,borderRadius:14,backgroundColor:'#E6DCF5'}} iconSize={side?40:48}/>
    <Text style={s.gameName}>{g.name}</Text>{g.mode&&<Text style={s.note}>{t(`modes.${g.mode}`)}</Text>}
    <View style={s.foot}>
     <Text style={s.big}>{n(id==='wins'?(g.wins??0):id==='rate'?100*(g.wins??0)/Math.max(1,g.known??0):g.matches)}{id==='rate'?'%':''}</Text>
     <Text style={s.note}>{id==='wins'?t('winsSample',{wins:g.wins,known:g.known,total:g.matches}):id==='rate'?t('knownResults',{count:g.known}):t('matchCount',{count:g.matches})}</Text>
    </View>
   </View>)}</View>
   {card.leaders.length>1&&<Text style={[s.note,{marginTop:6}]}>{t('highlightTies')}</Text>}
  </>}
  {id==='company'&&<><Text style={s.big}>{card.companyMatches==null?'—':n(card.companyMatches)}</Text><Text style={s.text}>{card.companyMatches==null?t('noCompany'):t('togetherCount',{count:card.companyMatches})}</Text>{card.companyTies>1&&<Text style={s.note}>{t('companyTies',{count:card.companyTies})}</Text>}<Text style={s.note}>{t('anonymousShare')}</Text></>}
  {id==='time'&&<><Text style={s.big}>{card.minutes==null?'—':formatDuration(card.minutes,i18n.language)}</Text><Text style={s.text}>{card.minutes==null?t('noDuration'):t('recordedTime')}</Text><Text style={s.note}>{t('durationCoverage',{known:card.durationKnown,total:card.matches})}</Text></>}
  {id==='month'&&<>{card.months.length===0&&<Text style={s.text}>{t('chartEmpty')}</Text>}{card.months.map(b=><View key={b.key} style={s.leader}><Text style={s.gameName}>{new Intl.DateTimeFormat(i18n.language,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${b.key}-01T12:00:00Z`))}</Text><Text style={s.big}>{n(b.matches)}</Text><Text style={s.note}>{t('matchCount',{count:b.matches})}</Text></View>)}{card.months.length>1&&<Text style={s.note}>{t('highlightTies')}</Text>}</>}
  <View style={s.scope}>
   <Text style={s.note}>{card.filterGame?t('yearGameScope',{name:card.filterGame}):t('allGames')} · {card.filterMode?t('yearModeScope',{mode:t(`modes.${card.filterMode}`)}):t('allModes')}</Text>
   <Text style={s.note}>{t('yearResultCoverage',{known:card.known,unknown:card.unknown})}</Text>
  </View>
 </View>;
}
const s=StyleSheet.create({
 card:{backgroundColor:colors.hero,borderRadius:18,borderCurve:'continuous',paddingVertical:20,paddingHorizontal:16,gap:6,alignItems:'center',overflow:'hidden'},
 brand:{fontSize:13,lineHeight:18,color:colors.primary,textAlign:'center',fontWeight:'600'},
 title:{...type.title,textAlign:'center',maxWidth:300},
 big:{...type.display,color:colors.primary,textAlign:'center'},
 text:{...type.body,textAlign:'center'},
 gameName:{...type.body,fontWeight:'600',textAlign:'center',marginTop:6},
 note:{...type.caption,textAlign:'center'},
 leaders:{alignSelf:'stretch',gap:16,marginTop:8,alignItems:'center'},
 leadersSide:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',alignItems:'stretch'},
 leader:{alignItems:'center',gap:4},
 foot:{marginTop:'auto',alignItems:'center',paddingTop:4},
 scope:{marginTop:6,gap:2,alignItems:'center'},
});
