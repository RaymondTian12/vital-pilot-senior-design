import { Tabs } from "expo-router";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { Icon, type IconName } from "@/components/design/icon";
const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: "home", title: "Home", icon: "home" },
  { name: "metrics", title: "Vitals", icon: "vitals" },
  { name: "chatbot", title: "Pilot AI", icon: "sparkles" },
  { name: "reports", title: "Reports", icon: "report" },
  { name: "profile", title: "Profile", icon: "person" },
];
export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primaryDark,
        tabBarInactiveTintColor: C.textSecondary,
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: C.background },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <Icon
                name={tab.icon}
                color={typeof color === "string" ? color : C.primaryDark}
                size={23}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
