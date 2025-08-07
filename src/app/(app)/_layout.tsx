// app/(app)/_layout.tsx

import 'react-native-get-random-values';

import { Drawer } from "expo-router/drawer";
import CustomDrawerContent from "@/src/components/drawer/CustomDrawerContent";



export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: "#6200EE",
        drawerLabelStyle: { marginLeft: -20, fontSize: 15 },
      }}
    >
      <Drawer.Screen
        name="dashboard/index"
        options={{ drawerLabel: "Home" }} // previously: "Início"
      />
    </Drawer>
  );
}
