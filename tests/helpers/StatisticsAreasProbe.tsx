import StatisticsWorkspace from '@/src/features/statistics/Workspace';
import AreasLayout from '@/src/app/(app)/statistics/(areas)/_layout';
import CompanyScreen from '@/src/features/statistics/screens/CompanyScreen';
export default function Probe({includeCompany=false}:{includeCompany?:boolean}){return <StatisticsWorkspace><AreasLayout/>{includeCompany&&<CompanyScreen/>}</StatisticsWorkspace>;}
