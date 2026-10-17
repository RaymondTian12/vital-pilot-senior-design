import { BloodPressureProvider } from "@/context/blood-pressure-context";
import { DefaultTheme, ThemeProvider } from "expo-router";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  ActivityIndicator,
  Appearance,
  Platform,
  Text,
  View,
} from "react-native";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { NotificationProvider } from "@/context/notification-context";
import { PreviewProvider } from "@/context/preview-context";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
if (Platform.OS !== "web") Appearance.setColorScheme("light");
SplashScreen.preventAutoHideAsync().catch(() => {});
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: C.background,
    card: C.white,
    text: C.title,
    primary: C.primary,
    border: C.border,
  },
};
export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="dark" />
      <AuthProvider>
        <Navigation />
        <AnimatedSplashOverlay />
      </AuthProvider>
    </ThemeProvider>
  );
}
function Navigation() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.background,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator color={C.primary} />
        <Text style={{ color: C.textSecondary }}>Restoring your session…</Text>
      </View>
    );
  return (
    <PreviewProvider key={user?.user_id ?? "guest"}>
      <BloodPressureProvider key={user?.user_id ?? "guest"}>
        <NotificationProvider key={user?.user_id ?? "guest"}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Protected guard={!user}>
              <Stack.Screen name="welcome" />
              <Stack.Screen name="signin" />
              <Stack.Screen name="signup" />
            </Stack.Protected>
            <Stack.Protected guard={!!user}>
              <Stack.Screen name="questionnaire" />
              <Stack.Screen name="doctors" />
              <Stack.Screen name="change-password" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="(tabs)" />
            </Stack.Protected>
          </Stack>
        </NotificationProvider>
      </BloodPressureProvider>
    </PreviewProvider>
  );
}
