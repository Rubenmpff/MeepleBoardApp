import {useState} from 'react';
import {useLocalSearchParams} from 'expo-router';
import {useStatisticsWorkspace} from '../components/Workspace';
import {Mode,Period,Query} from '../types/Statistics';
import {localISO,periodQuery} from '../utils/period';
export default function useRouteQuery(){
 const workspace=useStatisticsWorkspace();
 const params=useLocalSearchParams();const value=(key:string)=>{const v=params[key];return Array.isArray(v)?v[0]:v;};
 const [query,setQuery]=useState<Query>(()=>({...periodQuery('year',localISO(new Date()),Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'),
  ...(value('start')?{start:value('start')!,endExclusive:value('endExclusive')!,timeZone:value('timeZone')||'UTC',gameId:value('gameId'),mode:value('mode') as Mode|undefined}:{})}));
 return {query:workspace?.query??query,setQuery:workspace?.setQuery??setQuery,period:workspace?.period??(value('period')||'year') as Period,value};
}
