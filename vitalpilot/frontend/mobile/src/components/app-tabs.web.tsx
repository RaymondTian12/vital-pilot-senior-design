import { Link, Slot, usePathname } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';

const tabs = [
  {
    label: 'Home',
    href: '/home',
  },
  {
    label: 'Explore',
    href: '/explore',
  },
  {
    label: 'Log',
    href: '/metrics',
  },
  {
    label: 'Pilot AI',
    href: '/chatbot',
  },
  {
    label: 'Reports',
    href: '/reports',
  },
  {
    label: 'Profile',
    href: '/profile',
  },
] as const;

export default function AppTabs() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>

      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          <Text style={styles.brand}>
            VitalPilot
          </Text>

          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                asChild
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.tabButton,
                    isActive &&
                      styles.tabButtonActive,
                    pressed &&
                      styles.tabButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive &&
                        styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBF9',
  },

  content: {
    flex: 1,
  },

  tabBarWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: VitalPilotColors.border,
  },

  tabBar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    gap: Spacing.two,
  },

  brand: {
    marginRight: 'auto',
    color: VitalPilotColors.title,
    fontSize: 16,
    fontWeight: '800',
  },

  tabButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },

  tabButtonActive: {
    backgroundColor:
      VitalPilotColors.mintStrong,
  },

  tabButtonPressed: {
    opacity: 0.7,
  },

  tabText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },

  tabTextActive: {
    color:
      VitalPilotColors.primaryDark,
    fontWeight: '800',
  },
});