import {Stack} from 'expo-router';
import StatisticsWorkspace from '@/src/features/statistics/components/Workspace';
export default function StatisticsLayout(){return <StatisticsWorkspace><Stack screenOptions={{headerShown:false}}><Stack.Screen name="(areas)" options={{animation:'none'}}/><Stack.Screen name="matches"/></Stack></StatisticsWorkspace>;}
