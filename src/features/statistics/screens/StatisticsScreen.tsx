import { useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import StatisticsHeader from "../StatisticsHeader";
import GameCover from "@/src/components/ui/GameCover";
import Button from "@/src/components/ui/ClubPrimaryButton";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
import useStatistics from "../hooks/useStatistics";
import { Metric, Mode, Period, Query } from "../types";
import { customQuery, inclusiveEnd, localISO, periodQuery, shiftAnchor } from "../utils/period";
import { styles } from "../styles";
const MODES:Mode[]=["COMPETITIVE","SOLO","COOPERATIVE","UNKNOWN"];
export default function StatisticsScreen() {
 const {width,fontScale}=useWindowDimensions();
 const {t,i18n}=useTranslation("statistics");const router=useRouter();
 const [timeZone]=useState(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC");
 const [anchor,setAnchor]=useState(()=>localISO(new Date()));const [period,setPeriod]=useState<Period>("year");
 const [query,setQuery]=useState<Query>(()=>periodQuery("year",localISO(new Date()),timeZone));
 const [customStart,setCustomStart]=useState(query.start),[customEnd,setCustomEnd]=useState(inclusiveEnd(query.endExclusive)),[invalid,setInvalid]=useState(false);
 const [chooseGame,setChooseGame]=useState(false);
 const {data,loading,error,refetch}=useStatistics(query);
 const number=(value:number|null)=>value==null?t("unavailable"):new Intl.NumberFormat(i18n.language,{maximumFractionDigits:2}).format(value);
 const show=(metric:Metric, extra:Partial<Query>&{bucket?:string}={})=>router.push({pathname:"/statistics/matches",params:{...query,...extra,metric}} as never);
 const changePeriod=(next:Period)=>{setPeriod(next);setInvalid(false);if(next==="custom"){setCustomStart(query.start);setCustomEnd(inclusiveEnd(query.endExclusive));}if(next!=="custom")setQuery(q=>({...q,...periodQuery(next,anchor,timeZone)}));};
 const shift=(direction:number)=>{const next=shiftAnchor(anchor,period,direction);setAnchor(next);if(period!=="custom")setQuery(q=>({...q,...periodQuery(period,next,timeZone)}));};
 const selectMode=(mode?:Mode)=>setQuery(q=>({...q,mode}));
 const metric=(label:string,value:string,onPress:()=>void,hint?:string)=><TouchableOpacity key={label} style={[styles.metric,{flexBasis:width<360||fontScale>1.25?"100%":154}]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityHint={t("viewSupporting")}>
  <Text style={styles.text}>{label}</Text><Text style={styles.value}>{value}</Text>{!!hint&&<Text style={styles.muted}>{hint}</Text>}<Text style={styles.link}>{t("viewMatches")} ›</Text>
 </TouchableOpacity>;
 return <SafeAreaView style={styles.screen} edges={["top","left","right"]}>
  <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
  <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
   <StatisticsHeader title={t("title")} backLabel={t("back")} onBack={()=>router.canGoBack()?router.back():router.replace("/dashboard")}/>
   <View style={styles.row}>{(["week","month","year","custom"] as Period[]).map(p=><TouchableOpacity key={p} accessibilityRole="button" accessibilityState={{selected:p===period}} style={[styles.control,p===period&&styles.selected]} onPress={()=>changePeriod(p)}><Text style={[styles.text,p===period&&styles.selectedText]}>{t(`period.${p}`)}</Text></TouchableOpacity>)}</View>
   <View style={styles.row}>
    {period!=="custom"&&<TouchableOpacity style={styles.control} accessibilityRole="button" accessibilityLabel={t("previousPeriod")} onPress={()=>shift(-1)}><Text style={styles.link}>‹</Text></TouchableOpacity>}
    <Text style={[styles.text,{flex:1}]}>{query.start} — {inclusiveEnd(query.endExclusive)}</Text>
    {period!=="custom"&&<TouchableOpacity style={styles.control} accessibilityRole="button" accessibilityLabel={t("nextPeriod")} onPress={()=>shift(1)}><Text style={styles.link}>›</Text></TouchableOpacity>}
   </View><Text style={styles.muted}>{t("timeZone",{zone:timeZone})}</Text>
   {period==="custom"&&<View style={styles.stack}>
    <Text style={styles.text}>{t("startDate")}</Text><TextInput style={styles.input} value={customStart} onChangeText={setCustomStart} accessibilityLabel={t("startDate")} placeholder="AAAA-MM-DD" autoCorrect={false}/>
    <Text style={styles.text}>{t("endDate")}</Text><TextInput style={styles.input} value={customEnd} onChangeText={setCustomEnd} accessibilityLabel={t("endDate")} placeholder="AAAA-MM-DD" autoCorrect={false}/>
    <Button title={t("apply")} onPress={()=>{const bounds=customQuery(customStart,customEnd,timeZone);setInvalid(!bounds);if(bounds){setQuery(q=>({...q,...bounds}));Keyboard.dismiss();}}}/>
    {invalid&&<Text style={styles.text} accessibilityRole="alert">{t("invalidDates")}</Text>}
   </View>}
   <View style={styles.stack}><Text style={styles.title}>{t("mode")}</Text><View style={styles.row}>
    <TouchableOpacity style={[styles.control,!query.mode&&styles.selected]} accessibilityRole="button" accessibilityState={{selected:!query.mode}} onPress={()=>selectMode()}><Text style={[styles.text,!query.mode&&styles.selectedText]}>{t("allModes")}</Text></TouchableOpacity>
    {MODES.map(mode=><TouchableOpacity key={mode} style={[styles.control,query.mode===mode&&styles.selected]} accessibilityRole="button" accessibilityState={{selected:query.mode===mode}} onPress={()=>selectMode(mode)}><Text style={[styles.text,query.mode===mode&&styles.selectedText]}>{t(`modes.${mode}`)}</Text></TouchableOpacity>)}
   </View></View>
   <TouchableOpacity style={styles.control} accessibilityRole="button" accessibilityState={{expanded:chooseGame}} onPress={()=>setChooseGame(v=>!v)}><Text style={styles.link}>{t("game")}: {query.gameId?data?.gameOptions.find(g=>g.gameId===query.gameId)?.name??t("selectedGame"):t("allGames")} ▾</Text></TouchableOpacity>
   {chooseGame&&<View style={styles.stack}>
    <Button variant="secondary" title={t("allGames")} onPress={()=>{setQuery(q=>({...q,gameId:undefined}));setChooseGame(false);}}/>
    {data?.gameOptions.map(game=><TouchableOpacity key={game.gameId} style={styles.control} accessibilityRole="button" accessibilityLabel={t("selectGame",{name:game.name})} onPress={()=>{setQuery(q=>({...q,gameId:game.gameId}));setChooseGame(false);}}><Text style={styles.text}>{game.name}</Text></TouchableOpacity>)}
   </View>}
   {loading?<View accessibilityState={{busy:true}}><ActivityIndicator color={theme.colors.primary}/><Text style={styles.muted}>{t("loading")}</Text></View>:error?<View style={styles.stack}><Text style={styles.text} accessibilityRole="alert">{t("error")}</Text><Button title={t("retry")} onPress={refetch}/></View>:data&&<>
    {data.matches===0&&<Text style={styles.text}>{t("empty")}</Text>}
    <View style={styles.row}>
     {metric(t("matches"),number(data.matches),()=>show("all"))}
     {metric(t("games"),number(data.distinctGames),()=>show("games"))}
     {metric(t("recordedTime"),data.recordedMinutes==null?t("unavailable"):`${number(data.recordedMinutes)} min`,()=>show("duration"),t("durationCoverage",{known:data.matchesWithDuration,total:data.matches}))}
    </View>
    <TouchableOpacity style={styles.control} accessibilityRole="button" onPress={()=>show("missing-duration")}><Text style={styles.link}>{t("missingDuration",{count:data.matchesWithoutDuration})} ›</Text></TouchableOpacity>
    <Text style={styles.title} accessibilityRole="header">{t("results")}</Text>
    {query.mode==="COOPERATIVE"&&<Text style={styles.muted}>{t("teamRule")}</Text>}
    <View style={styles.row}>
     {metric(t("wins"),number(data.results.wins),()=>show("wins"))}{metric(t("losses"),number(data.results.losses),()=>show("losses"))}{metric(t("draws"),number(data.results.draws),()=>show("draws"))}
     {metric(t("winRate"),data.results.winRate==null?t("unavailable"):`${number(data.results.winRate)}%`,()=>show("known"),t("knownResults",{count:data.results.known}))}
    </View>
    <Text style={styles.muted}>{t("rateRule")}</Text>
    <TouchableOpacity style={styles.control} accessibilityRole="button" onPress={()=>show("undefined")}><Text style={styles.link}>{t("withoutResult",{count:data.results.withoutResult})} ›</Text></TouchableOpacity>
    <TouchableOpacity style={styles.control} accessibilityRole="button" onPress={()=>show("legacy")}><Text style={styles.link}>{t("legacy",{count:data.results.legacy})} ›</Text></TouchableOpacity>
    <Text style={styles.muted}>{t("legacyRule")}</Text>
    {!query.mode&&data.modes.filter(m=>m.matches>0).map(mode=><View key={mode.mode} style={styles.card}>
     <TouchableOpacity accessibilityRole="button" style={styles.control} onPress={()=>{selectMode(mode.mode);}}><Text style={styles.title}>{t(`modes.${mode.mode}`)} ›</Text></TouchableOpacity>
     {mode.mode==="COOPERATIVE"&&<Text style={styles.muted}>{t("teamRule")}</Text>}
     <View style={styles.row}>{(["wins","losses","draws"] as const).map(outcome=><TouchableOpacity key={outcome} style={styles.control} accessibilityRole="button" onPress={()=>show(outcome,{mode:mode.mode})}><Text style={styles.link}>{t(outcome)}: {mode.results[outcome]} ›</Text></TouchableOpacity>)}</View>
     <TouchableOpacity style={styles.control} accessibilityRole="button" onPress={()=>show("known",{mode:mode.mode})}><Text style={styles.link}>{t("winRate")}: {mode.results.winRate==null?t("unavailable"):`${number(mode.results.winRate)}%`} · {t("knownResults",{count:mode.results.known})} ›</Text></TouchableOpacity>
    </View>)}
    <Text style={styles.title} accessibilityRole="header">{t("personalRating")}</Text>
    {metric(t("averageRating"),number(data.averagePersonalRating),()=>show("ratings"),t("ratingCoverage",{known:data.ratedMatches,total:data.matches}))}
    <Text style={styles.muted}>{t("ratingRule")}</Text>
    <Text style={styles.title} accessibilityRole="header">{t("evolution")}</Text>
    {data.evolution.map(bucket=><TouchableOpacity key={bucket.key} style={styles.control} accessibilityRole="button" accessibilityLabel={`${bucket.key}: ${bucket.matches}`} onPress={()=>show("all",{bucket:bucket.key})}>
     <Text style={styles.text}>{bucket.key} · {t("matchCount",{count:bucket.matches})}</Text>
     <View style={[styles.bar,{width:`${100*bucket.matches/Math.max(1,...data.evolution.map(b=>b.matches))}%`}]} />
    </TouchableOpacity>)}
    <Text style={styles.title} accessibilityRole="header">{t("mostPlayed")}</Text>
    {data.games.filter((g,index)=>index<5||g.matches===(data.games[4]?.matches)).map(game=><TouchableOpacity key={game.gameId} style={styles.gameRow} accessibilityRole="button" accessibilityLabel={game.name} onPress={()=>show("all",{gameId:game.gameId})}>
     <GameCover uri={game.imageUrl} style={styles.cover}/><View style={styles.grow}><Text style={styles.gameName}>{game.name}</Text><Text style={styles.muted}>{t("matchCount",{count:game.matches})}</Text><Text style={styles.link}>{t("viewMatches")} ›</Text></View>
    </TouchableOpacity>)}
    <Button title={t("refresh")} variant="secondary" onPress={refetch}/>
    <Text style={styles.muted}>{t("historyScope")}</Text>
   </>}
  </ScrollView></KeyboardAvoidingView>
 </SafeAreaView>;
}
