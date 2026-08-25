import { Image } from 'expo-image';
import {
  Slot,
  usePathname,
  useRouter,
} from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { VitalPilotColors } from '@/constants/vitalpilot';

type WebRoute =
  | '/home'
  | '/metrics'
  | '/explore'
  | '/reports'
  | '/chatbot'
  | '/profile'
  | '/welcome';

type NavigationItem = {
  label: string;
  href: WebRoute;
  icon: string;
};

const manageTabs: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/home',
    icon: '⌂',
  },
  {
    label: 'Vitals',
    href: '/metrics',
    icon: '⌁',
  },
  {
    label: 'Explore',
    href: '/explore',
    icon: '◇',
  },
  {
    label: 'Medical Reports',
    href: '/reports',
    icon: '▤',
  },
  {
    label: 'Pilot AI',
    href: '/chatbot',
    icon: '✦',
  },
];

export default function AppTabs() {
  const pathname = usePathname();
  const router = useRouter();

  function navigate(href: WebRoute) {
    router.push(href);
  }

  function handleLogoPress() {
    router.push('/home');
  }

  function handleLogout() {
    /*
     * Frontend prototype:
     * Return the user to the public welcome screen.
     *
     * Later, when authentication is fully connected,
     * clear the stored access/refresh tokens here first.
     */
    router.replace('/welcome');
  }

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <Pressable
          onPress={handleLogoPress}
          style={({ pressed }) => [
            styles.logoRow,
            pressed && styles.pressed,
          ]}
        >
          <Image
            source={require('../../assets/images/vitalpilot/logo_green.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <Text style={styles.logoText}>
            VitalPilot
          </Text>
        </Pressable>

        <Text style={styles.groupLabel}>
          MANAGE
        </Text>

        <View style={styles.navList}>
          {manageTabs.map((tab) => {
            const active = pathname === tab.href;

            return (
              <Pressable
                key={tab.href}
                onPress={() => navigate(tab.href)}
                style={
                  active
                    ? styles.navItemActive
                    : styles.navItem
                }
              >
                <Text
                  style={
                    active
                      ? styles.navIconActive
                      : styles.navIcon
                  }
                >
                  {tab.icon}
                </Text>

                <Text
                  style={
                    active
                      ? styles.navTextActive
                      : styles.navText
                  }
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sidebarBottom}>
          <Text style={styles.groupLabel}>
            SETTINGS
          </Text>

          <Pressable
            onPress={() => navigate('/profile')}
            style={
              pathname === '/profile'
                ? styles.navItemActive
                : styles.navItem
            }
          >
            <Text
              style={
                pathname === '/profile'
                  ? styles.navIconActive
                  : styles.navIcon
              }
            >
              ○
            </Text>

            <Text
              style={
                pathname === '/profile'
                  ? styles.navTextActive
                  : styles.navText
              }
            >
              Profile
            </Text>
          </Pressable>

          <View style={styles.securityCard}>
            <View style={styles.securityShield}>
              <Text style={styles.securityShieldText}>
                ✓
              </Text>
            </View>

            <Text style={styles.securityTitle}>
              Your health is our priority
            </Text>

            <Text style={styles.securityText}>
              We keep your data secure and private.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.webHeader}>
          <Pressable
            onPress={handleLogoPress}
            style={({ pressed }) => [
              styles.webBrandButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.webBrand}>
              VitalPilot
            </Text>
          </Pressable>

          <View style={styles.headerSpacer} />

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logout}>
              Log out
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigate('/profile')}
            style={({ pressed }) => [
              styles.profileCircle,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.profileInitials}>
              JD
            </Text>
          </Pressable>
        </View>

        <View style={styles.slot}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',

    backgroundColor: '#F7FAF8',
  },

  sidebar: {
    width: 230,

    backgroundColor: '#FFFFFF',

    borderRightWidth: 1,
    borderRightColor: '#E5EAE7',

    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 42,
  },

  logo: {
    width: 36,
    height: 36,

    marginRight: 8,
  },

  logoText: {
    color: '#111827',

    fontSize: 24,
    fontWeight: '900',
  },

  groupLabel: {
    color: '#8A94A2',

    fontSize: 11,
    fontWeight: '700',

    letterSpacing: 1,

    marginBottom: 10,
  },

  navList: {
    width: '100%',
  },

  navItem: {
    minHeight: 48,

    borderRadius: 14,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 12,

    marginBottom: 6,
  },

  navItemActive: {
    minHeight: 48,

    borderRadius: 14,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 12,

    marginBottom: 6,

    backgroundColor: '#ECF8F2',
  },

  navIcon: {
    width: 24,

    marginRight: 12,

    textAlign: 'center',

    color: '#5C6978',

    fontSize: 18,
  },

  navIconActive: {
    width: 24,

    marginRight: 12,

    textAlign: 'center',

    color: '#11825F',

    fontSize: 18,
    fontWeight: '800',
  },

  navText: {
    color: '#344054',

    fontSize: 14,
    fontWeight: '600',
  },

  navTextActive: {
    color: '#11825F',

    fontSize: 14,
    fontWeight: '800',
  },

  sidebarBottom: {
    marginTop: 'auto',
  },

  securityCard: {
    marginTop: 24,

    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFEAE4',

    backgroundColor: '#F6FBF8',

    padding: 16,

    alignItems: 'center',
  },

  securityShield: {
    width: 42,
    height: 42,

    borderRadius: 21,

    borderWidth: 2,
    borderColor: VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 10,
  },

  securityShieldText: {
    color: VitalPilotColors.primaryDark,

    fontSize: 18,
    fontWeight: '900',
  },

  securityTitle: {
    color: '#101828',

    textAlign: 'center',

    fontWeight: '800',
    fontSize: 14,
  },

  securityText: {
    color: '#667085',

    textAlign: 'center',

    fontSize: 11,
    lineHeight: 17,

    marginTop: 6,
  },

  main: {
    flex: 1,

    minWidth: 0,
  },

  webHeader: {
    minHeight: 74,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 28,

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 1,
    borderBottomColor: '#E7ECE9',
  },

  webBrandButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },

  webBrand: {
    color: '#101828',

    fontSize: 19,
    fontWeight: '800',
  },

  headerSpacer: {
    flex: 1,
  },

  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,

    marginRight: 8,
  },

  logout: {
    color: '#667085',

    fontSize: 13,
    fontWeight: '600',
  },

  profileCircle: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: '#E6F5EE',

    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInitials: {
    color: '#11825F',

    fontWeight: '800',
    fontSize: 11,
  },

  slot: {
    flex: 1,

    minHeight: 0,
  },

  pressed: {
    opacity: 0.65,
  },
});