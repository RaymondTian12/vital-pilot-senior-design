import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NotificationProvider } from '@/context/notification-context';

/*
 * Keep the native splash screen visible until
 * AnimatedSplashOverlay finishes its startup sequence.
 */
SplashScreen.preventAutoHideAsync().catch(() => {
  // Prevent an unhandled promise warning during development.
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={
        colorScheme === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >
      <NotificationProvider>
        <AnimatedSplashOverlay />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />

          <Stack.Screen name="welcome" />

          <Stack.Screen name="signin" />

          <Stack.Screen name="signup" />

          <Stack.Screen name="questionnaire" />

          <Stack.Screen name="doctors" />

          <Stack.Screen name="change-password" />

          <Stack.Screen name="notifications" />

          <Stack.Screen name="(tabs)" />
        </Stack>
      </NotificationProvider>
    </ThemeProvider>
  );
}