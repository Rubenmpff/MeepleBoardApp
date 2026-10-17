import { locale } from '@/src/ui/format';
import {useEffect,useState} from 'react';
import {Keyboard,Platform,StyleSheet,Text,TouchableOpacity,View,useWindowDimensions} from 'react-native';
import {useTranslation} from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import GameCover from '@/src/ui/GameCover';
import {GameSummary,Mode,Period,Query} from '../types/Statistics';
import {customQuery,inclusiveEnd,localISO,periodQuery,shiftAnchor} from '../utils/period';
import {formatPeriodLabel} from '../utils/presentation';
import Sheet from '@/src/ui/Sheet';
import {Card,Glyph,Row,Segmented} from '@/src/ui/components';
import {colors,isLarge,space,strong,touch,type} from '@/src/ui/theme';
const MODES:Mode[]=['COMPETITIVE','SOLO','COOPERATIVE','UNKNOWN'];
const currentYear=(query:Query)=>new Intl.DateTimeFormat('en',{year:'numeric',timeZone:query.timeZone}).format(new Date());
export const isCurrentYear=(period:Period,query:Query)=>period==='year'&&query.start.slice(0,4)===currentYear(query);
export const activeFilterCount=(query:Query)=>(query.gameId?1:0)+(query.mode?1:0);
export function useFilterLabels(query:Query,games:GameSummary[]){
 const {t}=useTranslation('statistics');
 return {game:query.gameId?games.find(g=>g.gameId===query.gameId)?.name??t('selectedGame'):t('allGames'),mode:query.mode?t(`modes.${query.mode}`):t('allModes')};
}

// Scope card: period and filters in one object, with the current choices summarised.
export default function ExploreFilters({query,onChange,games,initialPeriod='year',onPeriodChange,visible,onVisibilityChange}:{query:Query;onChange:(q:Query)=>void;games:GameSummary[];initialPeriod?:Period;onPeriodChange?:(p:Period)=>void;visible?:boolean;onVisibilityChange?:(open:boolean)=>void}){
 const {t,i18n}=useTranslation('statistics');const {width,fontScale}=useWindowDimensions();const large=isLarge(width,fontScale);
 const [localPeriod,setLocalPeriod]=useState(initialPeriod);
 const [localOpen,setLocalOpen]=useState(false);
 const period=onPeriodChange?initialPeriod:localPeriod;
 const open=visible??localOpen;
 const setOpen=(next:boolean)=>{setLocalOpen(next);onVisibilityChange?.(next);};
 const labels=useFilterLabels(query,games);
 const periodLabel=formatPeriodLabel(period,query,i18n.language)+(isCurrentYear(period,query)?` · ${t('toDate').toLocaleLowerCase(i18n.language)}`:'');
 const fullPeriodLabel=formatPeriodLabel(period,query,i18n.language,true);
 const active=activeFilterCount(query);
 return <View>
  <Card style={[s.scope,large&&s.scopeLarge]}>
   <TouchableOpacity style={s.scopeMain} accessibilityRole="button" accessibilityLabel={`${fullPeriodLabel} · ${t(`period.${period}`)}`} accessibilityHint={t('filters')} accessibilityState={{expanded:open}} onPress={()=>setOpen(true)}>
    <View style={s.periodLine}><Text style={[type.body,strong,s.shrink]}>{periodLabel}</Text><Glyph name="chevron-down" size={18} color={colors.primary}/></View>
    <Text style={type.caption}>{labels.game} · {labels.mode}</Text>
   </TouchableOpacity>
   <View style={large?s.dividerH:s.dividerV}/>
   <FilterButton count={active} onPress={()=>setOpen(true)} expanded={open}/>
  </Card>
  <FiltersSheet visible={open} query={query} period={period} games={games} onClose={()=>{setOpen(false);Keyboard.dismiss();}}
   onApply={(next,nextPeriod)=>{onChange(next);setLocalPeriod(nextPeriod);onPeriodChange?.(nextPeriod);setOpen(false);Keyboard.dismiss();}}/>
 </View>;
}

export function FilterButton({count,onPress,expanded}:{count:number;onPress:()=>void;expanded?:boolean}){
 const {t}=useTranslation('statistics');
 return <TouchableOpacity style={s.filterButton} accessibilityRole="button" accessibilityLabel={t('filters')} accessibilityValue={count?{text:t('activeFilters',{count})}:undefined} accessibilityState={{expanded:!!expanded}} onPress={onPress}>
  <Glyph name="tune-variant" size={20} color={colors.primary}/>
  <Text style={[type.body,strong,{color:colors.primary}]}>{t('filters')}</Text>
  {count>0&&<View style={s.badge}><Text style={s.badgeText}>{count}</Text></View>}
 </TouchableOpacity>;
}

type Page='main'|'game'|'mode';
// Choices stay in a draft until Apply; Cancel or the scrim keep the current query.
export function FiltersSheet({visible,query,period,games,onClose,onApply,periodEditable=true}:{visible:boolean;query:Query;period:Period;games:GameSummary[];onClose:()=>void;onApply:(q:Query,p:Period)=>void;periodEditable?:boolean}){
 const {t,i18n}=useTranslation('statistics');const {width,fontScale}=useWindowDimensions();
 const [draft,setDraft]=useState(query),[draftPeriod,setDraftPeriod]=useState(period),[page,setPage]=useState<Page>('main');
 const [customStart,setCustomStart]=useState(query.start),[customEnd,setCustomEnd]=useState(inclusiveEnd(query.endExclusive));
 const [invalid,setInvalid]=useState(false),[datePicker,setDatePicker]=useState<'start'|'end'|null>(null);
 useEffect(()=>{if(visible){setDraft(query);setDraftPeriod(period);setCustomStart(query.start);setCustomEnd(inclusiveEnd(query.endExclusive));setInvalid(false);setDatePicker(null);setPage('main');}},[visible]);
 const labels=useFilterLabels(draft,games);
 const dateLabel=(iso:string)=>new Intl.DateTimeFormat(locale(i18n.language),{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${iso}T12:00:00Z`));
 const changePeriod=(next:Period)=>{
  setDraftPeriod(next);setInvalid(false);setDatePicker(null);
  if(next==='custom'){setCustomStart(draft.start);setCustomEnd(inclusiveEnd(draft.endExclusive));}
  else setDraft(q=>({...q,...periodQuery(next,draft.start,q.timeZone)}));
 };
 const shift=(direction:number)=>{if(draftPeriod==='custom')return;const next=shiftAnchor(draft.start,draftPeriod,direction);setDraft(q=>({...q,...periodQuery(draftPeriod,next,q.timeZone)}));};
 const apply=()=>{
  const bounds=periodEditable&&draftPeriod==='custom'?customQuery(customStart,customEnd,draft.timeZone):draft;
  setInvalid(!bounds);if(!bounds)return;
  onApply({...draft,...bounds},periodEditable?draftPeriod:period);setDatePicker(null);
 };
 const choose=(change:Partial<Query>)=>{setDraft(q=>({...q,...change}));setPage('main');};
 const sub=page!=='main';
 return <Sheet visible={visible} title={page==='game'?t('game'):page==='mode'?t('mode'):t('filters')} onClose={onClose} closeLabel={t('closeFilters')}
  left={sub?{label:t('filters'),back:true,accessibilityLabel:t('backToFilters'),onPress:()=>setPage('main')}:{label:t('cancel'),accessibilityLabel:t('closeFilters'),onPress:onClose}}
  right={sub?undefined:{label:t('applyShort'),accessibilityLabel:t('applyFilters'),bold:true,onPress:apply}}>
  {page==='main'&&<>
   {periodEditable&&<View style={s.group}>
    <Text style={[type.body,strong]}>{t('periodFilter')}</Text>
    <Segmented role="button" items={(['week','month','year','custom'] as Period[]).map(p=>({key:p,label:t(`period.${p}`)}))} value={draftPeriod} onChange={changePeriod}/>
    {draftPeriod!=='custom'&&<View style={s.stepper}>
     <TouchableOpacity style={s.circle} accessibilityRole="button" accessibilityLabel={t('previousPeriod')} onPress={()=>shift(-1)}><Glyph name="chevron-left" size={24} color={colors.primary}/></TouchableOpacity>
     <Text style={[type.head,s.stepperLabel]}>{formatPeriodLabel(draftPeriod,draft,i18n.language)}</Text>
     <TouchableOpacity style={s.circle} accessibilityRole="button" accessibilityLabel={t('nextPeriod')} onPress={()=>shift(1)}><Glyph name="chevron-right" size={24} color={colors.primary}/></TouchableOpacity>
    </View>}
    {draftPeriod==='custom'&&<Card>
     {(['start','end'] as const).map((field,index)=><View key={field}>
      <Row first={index===0} lead={<Glyph name="calendar-month-outline" size={22} color={colors.primary}/>} inset={50}
       title={t(field==='start'?'calendarStart':'calendarEnd')} detail={<Text style={[type.body,strong]}>{dateLabel(field==='start'?customStart:customEnd)}</Text>}
       end={datePicker===field?'collapse':'expand'} accessibilityLabel={t(field==='start'?'calendarStart':'calendarEnd')} onPress={()=>setDatePicker(v=>v===field?null:field)}/>
      {datePicker===field&&<View style={s.picker}><DateTimePicker value={new Date(`${field==='start'?customStart:customEnd}T12:00:00`)} mode="date" display={Platform.OS==='ios'?(width>=360&&fontScale<=1.5?'inline':'spinner'):'default'} locale={i18n.language.startsWith('pt')?'pt-PT':i18n.language} themeVariant="light" accentColor={colors.primary}
       onChange={(event,chosen)=>{if(event.type==='set'&&chosen){(field==='start'?setCustomStart:setCustomEnd)(localISO(chosen));setInvalid(false);}if(Platform.OS!=='ios')setDatePicker(null);}}/></View>}
     </View>)}
    </Card>}
    {invalid&&<Text style={[type.body,{color:colors.loss}]} accessibilityRole="alert">{t('invalidDates')}</Text>}
   </View>}
   <Card>
    <Row first title={t('game')} value={labels.game} accessibilityLabel={`${t('game')}: ${labels.game}`} onPress={()=>setPage('game')}/>
    <Row title={t('modeShort')} value={labels.mode} accessibilityLabel={`${t('mode')}: ${labels.mode}`} onPress={()=>setPage('mode')}/>
   </Card>
   <View style={s.notes}><Text style={type.caption}>{t('sharedFilters')}</Text><Text style={type.caption}>{t('timeZone',{zone:query.timeZone})}</Text></View>
  </>}
  {page==='game'&&<>
   <Card>
    <Row first title={t('allGames')} end="check" selected={!draft.gameId} onPress={()=>choose({gameId:undefined})}/>
    {games.map(game=><Row key={game.gameId} inset={72} lead={<GameCover uri={game.imageUrl} style={s.cover} iconSize={22}/>} title={game.name} end="check" selected={draft.gameId===game.gameId}
     accessibilityLabel={t('selectGame',{name:game.name})} onPress={()=>choose({gameId:game.gameId})}/>)}
   </Card>
   <Text style={[type.caption,s.pad]}>{t('draftNote')}</Text>
  </>}
  {page==='mode'&&<>
   <Card>{([undefined,...MODES] as (Mode|undefined)[]).map((mode,index)=><Row key={mode??'all'} first={index===0} title={mode?t(`modes.${mode}`):t('allModes')} end="check" selected={draft.mode===mode} onPress={()=>choose({mode})}/>)}</Card>
   <Text style={[type.caption,s.pad]}>{t('draftNote')}</Text>
  </>}
 </Sheet>;
}

const s=StyleSheet.create({
 scope:{flexDirection:'row',alignItems:'stretch',minHeight:60},
 scopeLarge:{flexDirection:'column'},
 scopeMain:{flex:1,minWidth:0,minHeight:touch,justifyContent:'center',gap:2,paddingVertical:space.sm,paddingLeft:space.lg,paddingRight:space.md},
 periodLine:{flexDirection:'row',alignItems:'center',gap:4},
 shrink:{flexShrink:1},
 dividerV:{width:1,backgroundColor:colors.line,marginVertical:space.md},
 dividerH:{height:1,backgroundColor:colors.line,marginHorizontal:space.lg},
 filterButton:{flexDirection:'row',alignItems:'center',gap:6,minHeight:touch,paddingLeft:space.md,paddingRight:14},
 badge:{minWidth:20,height:20,borderRadius:10,paddingHorizontal:6,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'},
 badgeText:{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.onPrimary},
 group:{gap:space.sm},
 stepper:{flexDirection:'row',alignItems:'center',gap:space.sm},
 stepperLabel:{flex:1,textAlign:'center'},
 circle:{width:touch,height:touch,borderRadius:touch/2,backgroundColor:colors.hero,alignItems:'center',justifyContent:'center'},
 picker:{paddingHorizontal:space.sm,paddingBottom:space.sm},
 cover:{width:44,height:44,borderRadius:10},
 notes:{gap:2,paddingHorizontal:space.lg},
 pad:{paddingHorizontal:space.lg},
});
