import api from "@/src/services/api";
import { MatchPage, Metric, Query, Summary, CompanyReport, ExploreReport, YearReport } from "../types";
export default {
 async company(query:Query,friendId?:string,signal?:AbortSignal):Promise<CompanyReport>{return (await api.get("/statistics/me/company",{params:{...query,friendId},signal})).data;},
 async explore(query:Query,signal?:AbortSignal):Promise<ExploreReport>{return (await api.get("/statistics/me/explore",{params:query,signal})).data;},
 async year(year:number,query:Query,signal?:AbortSignal):Promise<YearReport>{return (await api.get("/statistics/me/year",{params:{year,timeZone:query.timeZone,mode:query.mode,gameId:query.gameId},signal})).data;},
 async summary(query: Query, signal?: AbortSignal): Promise<Summary> {return (await api.get<Summary>("/statistics/me",{params:query,signal})).data;},
 async matches(query: Query, metric: Metric, offset=0, bucket?: string, signal?: AbortSignal, extra: {friendId?:string;scoreValue?:number} = {}): Promise<MatchPage> {
  return (await api.get<MatchPage>("/statistics/me/matches",{params:{...query,...extra,metric,offset,limit:25,bucket},signal})).data;
 },
};
