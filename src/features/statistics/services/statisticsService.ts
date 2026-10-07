import api from "@/src/services/api";
import { MatchPage, Metric, Query, Summary } from "../types";
export default {
 async summary(query: Query, signal?: AbortSignal): Promise<Summary> {return (await api.get<Summary>("/statistics/me",{params:query,signal})).data;},
 async matches(query: Query, metric: Metric, offset=0, bucket?: string, signal?: AbortSignal): Promise<MatchPage> {
  return (await api.get<MatchPage>("/statistics/me/matches",{params:{...query,metric,offset,limit:25,bucket},signal})).data;
 },
};
