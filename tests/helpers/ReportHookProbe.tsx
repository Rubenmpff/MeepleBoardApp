import useReport from '@/src/features/statistics/hooks/useReport';
export default function ReportHookProbe({scope,load}:{scope:string;load:(signal:AbortSignal)=>Promise<unknown>}){useReport(scope,load);return null;}
