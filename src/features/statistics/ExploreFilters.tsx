import {useState} from 'react';
import {Keyboard,Text,TextInput,TouchableOpacity,View,useWindowDimensions} from 'react-native';
import {useTranslation} from 'react-i18next';
import {GameSummary,Mode,Period,Query} from './types';
import {customQuery,inclusiveEnd,periodQuery,shiftAnchor} from './utils/period';
import {styles} from './styles';
export default function ExploreFilters({query,onChange,games,initialPeriod='year'}:{query:Query;onChange:(q:Query)=>void;games:GameSummary[];initialPeriod?:Period}){
 const {t,i18n}=useTranslation('statistics');const {width,fontScale}=useWindowDimensions();
 const [period,setPeriod]=useState<Period>(initialPeriod),[open,setOpen]=useState<'game'|'mode'|null>(null);
 const [start,setStart]=useState(query.start),[end,setEnd]=useState(inclusiveEnd(query.endExclusive)),[invalid,setInvalid]=useState(false);
 const change=(p:Period)=>{setPeriod(p);setInvalid(false);if(p==='custom'){setStart(query.start);setEnd(inclusiveEnd(query.endExclusive));}else onChange({...query,...periodQuery(p,query.start,query.timeZone)});};
 const item=(label:string,action:()=>void,selected=false,accessibleLabel=label)=><TouchableOpacity key={label} style={styles.option} accessibilityRole="button" accessibilityLabel={accessibleLabel} accessibilityState={{selected}} onPress={action}><Text style={styles.text}>{label}{selected?' ✓':''}</Text></TouchableOpacity>;
 return <View style={styles.stack}>
  <View style={styles.periods}>{(['week','month','year','custom'] as Period[]).map(p=><TouchableOpacity key={p} style={[styles.period,p===period&&styles.selected]} accessibilityRole="button" accessibilityState={{selected:p===period}} onPress={()=>change(p)}><Text style={[styles.text,p===period&&styles.selectedText]}>{t(`period.${p}`)}</Text></TouchableOpacity>)}</View>
  <View style={styles.row}>
   {period!=='custom'&&item('‹',()=>onChange({...query,...periodQuery(period,shiftAnchor(query.start,period,-1),query.timeZone)}),false,t('previousPeriod'))}
   <Text style={[styles.text,styles.grow,{textAlign:"center"}]}>{period==='year'?query.start.slice(0,4):period==='month'?new Intl.DateTimeFormat(i18n.language,{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(query.start+"T12:00:00Z")):`${query.start} — ${inclusiveEnd(query.endExclusive)}`}</Text>
   {period!=='custom'&&item('›',()=>onChange({...query,...periodQuery(period,shiftAnchor(query.start,period,1),query.timeZone)}),false,t('nextPeriod'))}
  </View>
  {period==='custom'&&<View style={styles.stack}>
   <Text style={styles.text}>{t('startDate')}</Text><TextInput style={styles.input} value={start} onChangeText={setStart} accessibilityLabel={t('startDate')} autoCorrect={false}/>
   <Text style={styles.text}>{t('endDate')}</Text><TextInput style={styles.input} value={end} onChangeText={setEnd} accessibilityLabel={t('endDate')} autoCorrect={false}/>
   {item(t('apply'),()=>{const bounds=customQuery(start,end,query.timeZone);setInvalid(!bounds);if(bounds){onChange({...query,...bounds});Keyboard.dismiss();}})}
   {invalid&&<Text style={styles.text} accessibilityRole="alert">{t('invalidDates')}</Text>}
  </View>}
  <View style={styles.row}>
   {(['game','mode'] as const).map(kind=><TouchableOpacity key={kind} style={[styles.selector,{flexBasis:width<360||fontScale>1.25?'100%':'46%'}]} accessibilityRole="button" accessibilityState={{expanded:open===kind}} accessibilityLabel={t(kind)} onPress={()=>setOpen(open===kind?null:kind)}>
    <Text style={[styles.text,styles.grow]}>{kind==='game'?(games.find(g=>g.gameId===query.gameId)?.name??t(query.gameId?'selectedGame':'allGames')):(query.mode?t(`modes.${query.mode}`):t('allModes'))} ⌄</Text>
   </TouchableOpacity>)}
  </View>
  {open==='game'&&<View style={styles.options}>{item(t('allGames'),()=>{onChange({...query,gameId:undefined});setOpen(null);},!query.gameId)}{games.map(g=>item(g.name,()=>{onChange({...query,gameId:g.gameId});setOpen(null);},query.gameId===g.gameId))}</View>}
  {open==='mode'&&<View style={styles.options}>{([undefined,'COMPETITIVE','SOLO','COOPERATIVE','UNKNOWN'] as (Mode|undefined)[]).map(mode=>item(mode?t(`modes.${mode}`):t('allModes'),()=>{onChange({...query,mode});setOpen(null);},query.mode===mode))}</View>}
 </View>;
}
