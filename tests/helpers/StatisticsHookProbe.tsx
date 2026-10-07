import { Text } from "react-native";
import useStatistics from "../../src/features/statistics/hooks/useStatistics";
import { Query } from "../../src/features/statistics/types";
export default function StatisticsHookProbe(query: Query) {
 const value=useStatistics(query);return <Text>{JSON.stringify({data:value.data,loading:value.loading,error:value.error})}</Text>;
}
