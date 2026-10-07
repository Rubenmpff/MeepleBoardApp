import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useTranslation } from "react-i18next";
import StatisticsHeader from "../StatisticsHeader";
import GameCover from "@/src/components/ui/GameCover";
import Button from "@/src/components/ui/ClubPrimaryButton";
import { APP_THEME as theme } from "@/src/styles/clubTheme";
import { MatchPage, Metric, Mode, Query } from "../types";
import service from "../services/statisticsService";
import { inclusiveEnd } from "../utils/period";
import { styles } from "../styles";
export default function StatisticsMatchesScreen() {
 const account=useSelector((state:RootState)=>state.auth.user?.id);
 const params=useLocalSearchParams();const router=useRouter();const {t,i18n}=useTranslation("statistics");
 const value=(key:string)=>{const v=params[key];return Array.isArray(v)?v[0]:v;};
 const query:Query={start:value("start")??"",endExclusive:value("endExclusive")??"",timeZone:value("timeZone")??"UTC",gameId:value("gameId"),mode:value("mode") as Mode|undefined};
 const metric=(value("metric")??"all") as Metric,bucket=value("bucket"),key=JSON.stringify({...query,metric,bucket});
 const scope=key+account;
 const [loadedScope,setLoadedScope]=useState(scope);
 const [page,setPage]=useState<MatchPage|null>(null),[offset,setOffset]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();let active=true;setLoading(true);setError(false);
  const requestOffset=loadedScope===scope?offset:0;
  if(requestOffset===0)setPage(null);
  const {metric,bucket,...filter}=JSON.parse(key);
  service.matches(filter,metric,requestOffset,bucket,controller.signal).then(result=>{if(active){setPage(previous=>({...result,items:requestOffset===0?result.items:[...(previous?.items??[]),...result.items]}));setLoadedScope(scope);if(requestOffset!==offset)setOffset(requestOffset);}})
   .catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;controller.abort();};
 },[key,offset,refresh,account]);
 const visiblePage=loadedScope===scope?page:null;
 const visibleLoading=loading||(!error&&loadedScope!==scope);
 const back=()=>router.canGoBack()?router.back():router.replace("/statistics");
 const date=(iso:string)=>new Intl.DateTimeFormat(i18n.language,{dateStyle:"medium",timeZone:query.timeZone}).format(new Date(iso));
 const num=(v:number)=>new Intl.NumberFormat(i18n.language,{maximumFractionDigits:2}).format(v);
 return <SafeAreaView style={styles.screen} edges={["top","left","right"]}><ScrollView contentContainerStyle={styles.content}>
  <StatisticsHeader title={t("supportingTitle")} subtitle={t(`metrics.${metric}`)} backLabel={t("back")} onBack={back}/>
  <Text style={styles.text}>{query.start} — {inclusiveEnd(query.endExclusive)}{bucket?` · ${bucket}`:""}</Text>
  <Text style={styles.muted}>{t("timeZone",{zone:query.timeZone})}{query.mode?` · ${t(`modes.${query.mode}`)}`:""}</Text>
  {visiblePage&&<Text style={styles.text}>{t("matchCount",{count:visiblePage.total})}</Text>}
  {visiblePage?.items.map(match=><TouchableOpacity key={match.id} style={styles.card} accessibilityRole="button" accessibilityLabel={match.gameName} onPress={()=>router.push({pathname:"/games/matches/[id]",params:{id:match.id}})}>
   <View style={styles.gameRow}><GameCover uri={match.gameImageUrl} style={styles.cover}/><View style={styles.grow}>
    <Text style={styles.gameName}>{match.gameName}</Text><Text style={styles.muted}>{date(match.matchDate)} · {t(`modes.${match.gameMode}`)}</Text>
   </View></View>
   <Text style={styles.text}>{match.resultSource==="Legacy"?t("legacyItem"):match.outcome?t(`outcomes.${match.outcome}`):t("undefinedItem")}{match.gameMode==="COOPERATIVE"?` · ${t("teamResult")}`:""}</Text>
   <Text style={styles.muted}>{t("recordedTime")}: {match.durationInMinutes==null?t("unavailable"):`${num(match.durationInMinutes)} min`}</Text>
   {match.score!=null&&<Text style={styles.text}>{t("myScore")}: {num(match.score)}</Text>}
   <Text style={styles.text}>{t("myRating")}: {match.personalRating==null?t("unrated"):`${num(match.personalRating)}/10`}</Text>
   <Text style={styles.link}>{t("details")} ›</Text>
  </TouchableOpacity>)}
  {visibleLoading&&<View accessibilityState={{busy:true}}><ActivityIndicator color={theme.colors.primary}/><Text style={styles.muted}>{t("loading")}</Text></View>}
  {error&&<View style={styles.stack}><Text style={styles.text} accessibilityRole="alert">{t("error")}</Text><Button title={t("retry")} onPress={()=>setRefresh(n=>n+1)}/></View>}
  {!visibleLoading&&!error&&visiblePage?.total===0&&<Text style={styles.text}>{t("empty")}</Text>}
  {!visibleLoading&&!error&&visiblePage&&visiblePage.items.length<visiblePage.total&&<Button title={t("more")} onPress={()=>setOffset(visiblePage.items.length)}/>}
 </ScrollView></SafeAreaView>;
}
