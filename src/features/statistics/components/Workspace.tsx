import {createContext,useContext,useState,useRef,ReactNode,Dispatch,SetStateAction,RefObject} from 'react';
import {useSelector} from 'react-redux';
import {useLocalSearchParams} from 'expo-router';
import {RootState} from '@/src/store/store';
import {Query,Period,Mode} from '../types/Statistics';
import {localISO,periodQuery} from '../utils/period';
type Workspace={companyBack:RefObject<(()=>void)|null>;query:Query;setQuery:Dispatch<SetStateAction<Query>>;period:Period;setPeriod:Dispatch<SetStateAction<Period>>};
const Context=createContext<Workspace|null>(null);
export const useStatisticsWorkspace=()=>useContext(Context);
function AccountWorkspace({children}:{children:ReactNode}){
 const params=useLocalSearchParams();const value=(key:string)=>{const v=params[key];return Array.isArray(v)?v[0]:v;};
 const [query,setQuery]=useState<Query>(()=>({...periodQuery('year',localISO(new Date()),Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'),...(value('start')?{start:value('start')!,endExclusive:value('endExclusive')!,timeZone:value('timeZone')||'UTC',gameId:value('gameId'),mode:value('mode') as Mode|undefined}:{})}));
 const [period,setPeriod]=useState<Period>((value('period') as Period)||'year');
 const companyBack=useRef<(()=>void)|null>(null);
 return <Context.Provider value={{query,setQuery,period,setPeriod,companyBack}}>{children}</Context.Provider>;
}
export default function StatisticsWorkspace({children}:{children:ReactNode}){
 const account=useSelector((s:RootState)=>s.auth.user?.id);
 return <AccountWorkspace key={account||'signed-out'}>{children}</AccountWorkspace>;
}
