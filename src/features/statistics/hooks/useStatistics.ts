import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import service from "../services/statisticsService";
import { Query, Summary } from "../types";
export default function useStatistics(query: Query) {
 const account=useSelector((state:RootState)=>state.auth.user?.id);
 const key=JSON.stringify(query);
 const [loadedKey,setLoadedKey]=useState("");
 const [data,setData]=useState<Summary|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  setData(null);setLoading(true);setError(false);
  service.summary(JSON.parse(key),controller.signal).then(value=>{if(active){setData(value);setLoadedKey(key+account);}}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;controller.abort();};
 },[key,refresh,account]);
 return {data:loadedKey===key+account?data:null,loading:loading||(!error&&loadedKey!==key+account),error,refetch:()=>setRefresh(n=>n+1)};
}
