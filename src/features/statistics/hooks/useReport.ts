import {useEffect,useState} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@/src/store/store';
// Identity and complete query form the cache scope; stale responses are cancelled.
export default function useReport<T>(key:string,load:(signal:AbortSignal)=>Promise<T>){
 const account=useSelector((s:RootState)=>s.auth.user?.id);
 const scope=key+account;
 const [loaded,setLoaded]=useState(''),[data,setData]=useState<T|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();let active=true;setData(null);setBusy(true);setError(false);
  load(controller.signal).then(value=>{if(active){setData(value);setLoaded(scope);}}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;controller.abort();};
 },[scope,revision]);
 return {data:loaded===scope?data:null,busy:busy||(!error&&loaded!==scope),error,refresh:()=>setRevision(n=>n+1)};
}
