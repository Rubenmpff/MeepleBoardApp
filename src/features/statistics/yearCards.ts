import {YearReport} from './types';
export const YEAR_CARDS=['overview','played','wins','rate','company','time','month','first'] as const;
export type YearCardId=typeof YEAR_CARDS[number];
// This projection is also used by the export: no arbitrary DTO spreading or friend data.
export function publicYearCard(report:YearReport,id:YearCardId){
 const game=(g:{gameId:string;name:string;imageUrl:string|null;matches:number;wins?:number;known?:number;mode?:string|null})=>({gameId:g.gameId,name:g.name,imageUrl:g.imageUrl,matches:g.matches,wins:g.wins,known:g.known,mode:g.mode});
 return {id,year:report.year,timeZone:report.timeZone,filterMode:report.summary.mode,filterGame:report.summary.gameId ? report.summary.gameOptions.find(g=>g.gameId===report.summary.gameId)?.name ?? null : null,matches:report.summary.matches,games:report.summary.distinctGames,
  known:report.summary.results.known,unknown:report.summary.results.withoutResult,
  leaders:(id==='played'?report.mostPlayed:id==='wins'?report.mostWins:id==='rate'?report.bestWinRate:id==='first'?report.firstRecordedGames:[]).map(game),
  companyMatches:id==='company'?report.mostFrequentCompanyMatches:null,companyTies:id==='company'?report.mostFrequentCompanyTies:0,
  minutes:id==='time'?report.summary.recordedMinutes:null,durationKnown:report.summary.matchesWithDuration,
  months:id==='month'?report.activeMonths.map(b=>({key:b.key,matches:b.matches})):[],minimumRateSample:report.rateMinimumSample};
}
