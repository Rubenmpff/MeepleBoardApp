import {Image,StyleSheet,Text,View} from 'react-native';
import {useTranslation} from 'react-i18next';
import GameCover from '@/src/components/ui/GameCover';
import {APP_THEME as theme} from '@/src/styles/clubTheme';
import {publicYearCard,YearCardId} from './yearCards';
import {YearReport} from './types';
export default function YearCard({report,id}:{report:YearReport;id:YearCardId}){
 const card=publicYearCard(report,id);const {t,i18n}=useTranslation('statistics');const n=(v:number)=>new Intl.NumberFormat(i18n.language,{maximumFractionDigits:2}).format(v);
 return <View style={[s.card,id==='company'&&s.gold]}>
  <View style={s.logoViewport}><Image source={require('@/assets/MeepleBoardLogo.png')} style={s.logo} resizeMode="contain" accessible={false}/></View>
  <Text style={s.brand}>MeepleBoard · {card.year}</Text><Text style={s.title} accessibilityRole="header">{t(`yearCards.${id}`)}</Text>
  {card.filterGame&&<Text style={s.note}>{t('yearGameScope',{name:card.filterGame})}</Text>}
  {card.filterMode&&<Text style={s.note}>{t('yearModeScope',{mode:t(`modes.${card.filterMode}`)})}</Text>}
  {id==='overview'&&<><Text style={s.big}>{n(card.matches)}</Text><Text style={s.text}>{t('matchCount',{count:card.matches})} · {t('differentGamesCount',{count:card.games})}</Text></>}
  {['played','wins','rate','first'].includes(id)&&<>
   {card.leaders.length===0&&<Text style={s.text}>{t(id==='rate'?'rateInsufficient':id==='first'?'noFirstGames':'noYearHighlight',{minimum:card.minimumRateSample})}</Text>}
   {card.leaders.map(g=><View key={g.gameId+(g.mode??'')} style={s.game}>
    <GameCover uri={g.imageUrl} style={{width:128,height:160,alignSelf:'center'}}/>
    <Text style={s.gameName}>{g.name}</Text>{g.mode&&<Text style={s.text}>{t(`modes.${g.mode}`)}</Text>}
    <Text style={s.big}>{n(id==='wins'?(g.wins??0):id==='rate'?100*(g.wins??0)/Math.max(1,g.known??0):g.matches)}{id==='rate'?'%':''}</Text>
    <Text style={s.text}>{id==='wins'?t('winsSample',{wins:g.wins,known:g.known,total:g.matches}):id==='rate'?t('knownResults',{count:g.known}):t('matchCount',{count:g.matches})}</Text>
   </View>)}
   {card.leaders.length>1&&<Text style={s.note}>{t('highlightTies')}</Text>}
   {id==='first'&&<Text style={s.note}>{t('firstHistoryNote')}</Text>}
  </>}
  {id==='company'&&<><Text style={s.big}>{card.companyMatches==null?'—':n(card.companyMatches)}</Text><Text style={s.text}>{card.companyMatches==null?t('noCompany'):t('togetherCount',{count:card.companyMatches})}</Text>{card.companyTies>1&&<Text style={s.note}>{t('companyTies',{count:card.companyTies})}</Text>}<Text style={s.note}>{t('anonymousShare')}</Text></>}
  {id==='time'&&<><Text style={s.big}>{card.minutes==null?'—':n(card.minutes)}</Text><Text style={s.text}>{card.minutes==null?t('noDuration'):t('recordedMinutes')}</Text><Text style={s.note}>{t('durationCoverage',{known:card.durationKnown,total:card.matches})}</Text></>}
  {id==='month'&&<>{card.months.length===0&&<Text style={s.text}>{t('chartEmpty')}</Text>}{card.months.map(b=><View key={b.key} style={s.game}><Text style={s.gameName}>{new Intl.DateTimeFormat(i18n.language,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${b.key}-01T12:00:00Z`))}</Text><Text style={s.big}>{n(b.matches)}</Text><Text style={s.text}>{t('matchCount',{count:b.matches})}</Text></View>)}{card.months.length>1&&<Text style={s.note}>{t('highlightTies')}</Text>}</>}
  <Text style={s.note}>{t('yearResultCoverage',{known:card.known,unknown:card.unknown})}</Text><Text style={s.note}>{t('historyScope')}</Text><Text style={s.note}>{t('timeZone',{zone:card.timeZone})}</Text>
 </View>;
}
const s=StyleSheet.create({
 card:{backgroundColor:theme.colors.hero,borderRadius:24,padding:24,gap:12},gold:{backgroundColor:theme.colors.journalSoft},
 logoViewport:{width:88,height:58,alignSelf:'center',overflow:'hidden'},logo:{position:'absolute',width:152,height:152,left:-34,top:-46},
 brand:{...theme.text.body,color:theme.colors.primary,textAlign:'center',fontWeight:'600'},title:{...theme.text.title,color:theme.colors.text,textAlign:'center'},
 big:{fontSize:36,lineHeight:44,fontWeight:'700',color:theme.colors.primary,textAlign:'center'},text:{...theme.text.body,color:theme.colors.text,textAlign:'center'},
 gameName:{...theme.text.title,color:theme.colors.text,textAlign:'center'},note:{...theme.text.body,color:theme.colors.muted,textAlign:'center'},game:{gap:8},
});
