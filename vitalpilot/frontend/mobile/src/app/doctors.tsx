import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalCard } from '@/components/vitalpilot/card';
import { VitalPilotColors } from '@/constants/vitalpilot';

type Provider = {
  id: string;
  name: string;
  specialty: string;
  facility: string;
  city: string;
  state: string;
  phone: string;
  distance: number;
};

const providers: Provider[] = [
  {
    id: '1',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Cardiology',
    facility: 'Arlington Heart Center',
    city: 'Arlington',
    state: 'TX',
    phone: '(817) 555-0142',
    distance: 2.8,
  },
  {
    id: '2',
    name: 'Dr. James Lee',
    specialty: 'Endocrinology',
    facility: 'North Texas Diabetes Center',
    city: 'Arlington',
    state: 'TX',
    phone: '(817) 555-0189',
    distance: 4.1,
  },
  {
    id: '3',
    name: 'Dr. Maya Chen',
    specialty: 'Primary Care',
    facility: 'UTA Family Health Clinic',
    city: 'Arlington',
    state: 'TX',
    phone: '(817) 555-0116',
    distance: 5.4,
  },
];

const specialties = [
  'All',
  'Cardiology',
  'Endocrinology',
  'Primary Care',
];

type DistanceFilter = 'all' | '5' | '10';

export default function DoctorsScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('All');

  const [distanceFilter, setDistanceFilter] =
    useState<DistanceFilter>('all');

  const [sharedProviderIds, setSharedProviderIds] =
    useState<string[]>([]);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const searchableText = `
        ${provider.name}
        ${provider.specialty}
        ${provider.facility}
        ${provider.city}
        ${provider.state}
      `.toLowerCase();

      const searchQuery = query.trim().toLowerCase();

      const matchesQuery =
        !searchQuery ||
        searchableText.includes(searchQuery);

      const matchesSpecialty =
        specialty === 'All' ||
        provider.specialty === specialty;

      const matchesDistance =
        distanceFilter === 'all' ||
        provider.distance <= Number(distanceFilter);

      return (
        matchesQuery &&
        matchesSpecialty &&
        matchesDistance
      );
    });
  }, [query, specialty, distanceFilter]);

  function toggleSharing(providerId: string) {
    setSharedProviderIds((current) =>
      current.includes(providerId)
        ? current.filter((id) => id !== providerId)
        : [...current, providerId]
    );
  }

  async function callProvider(phone: string) {
    const cleanedPhone =
      phone.replace(/[^\d+]/g, '');

    try {
      await Linking.openURL(
        `tel:${cleanedPhone}`
      );
    } catch {
      console.log(
        'Unable to open the phone application.'
      );
    }
  }

  function goHome() {
    router.replace('/home');
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>

            <Text style={styles.backText}>
              Back
            </Text>
          </Pressable>

          <Pressable
            onPress={goHome}
            style={({ pressed }) => [
              styles.logoButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go to VitalPilot home"
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
        </View>

        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.title}>
            Doctor Referral
          </Text>

          <Text style={styles.subtitle}>
            Find a healthcare provider by name,
            specialty, facility, or location.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>
            🔍
          </Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search doctor, specialty, or facility"
            placeholderTextColor="#98A2B3"
            style={styles.searchInput}
            autoCapitalize="none"
            accessibilityLabel="Search healthcare providers"
          />

          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>
                ×
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Specialty Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>
            Specialty
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.specialtyRow
            }
          >
            {specialties.map((item) => {
              const selected =
                specialty === item;

              return (
                <Pressable
                  key={item}
                  onPress={() =>
                    setSpecialty(item)
                  }
                  style={
                    selected
                      ? styles.filterChipSelected
                      : styles.filterChip
                  }
                >
                  <Text
                    style={
                      selected
                        ? styles.filterTextSelected
                        : styles.filterText
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Distance Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>
            Distance
          </Text>

          <View style={styles.distanceRow}>
            <DistanceButton
              label="Any Distance"
              selected={
                distanceFilter === 'all'
              }
              onPress={() =>
                setDistanceFilter('all')
              }
            />

            <DistanceButton
              label="Within 5 mi"
              selected={
                distanceFilter === '5'
              }
              onPress={() =>
                setDistanceFilter('5')
              }
            />

            <DistanceButton
              label="Within 10 mi"
              selected={
                distanceFilter === '10'
              }
              onPress={() =>
                setDistanceFilter('10')
              }
            />
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <View style={styles.privacyIcon}>
            <Text
              style={styles.privacyIconText}
            >
              ✓
            </Text>
          </View>

          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>
              Your health information stays
              private
            </Text>

            <Text style={styles.privacyText}>
              Healthcare providers do not
              automatically receive access to
              your VitalPilot health information.
              Sharing requires your explicit
              authorization.
            </Text>
          </View>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Providers
          </Text>

          <Text style={styles.resultsCount}>
            {filteredProviders.length}{' '}
            {filteredProviders.length === 1
              ? 'provider'
              : 'providers'}{' '}
            found
          </Text>
        </View>

        {/* Empty State */}
        {filteredProviders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>
                🔍
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              No providers found
            </Text>

            <Text style={styles.emptyText}>
              Try changing the specialty,
              increasing the distance, or
              searching for another provider or
              facility.
            </Text>

            <Pressable
              onPress={() => {
                setQuery('');
                setSpecialty('All');
                setDistanceFilter('all');
              }}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>
                Clear Filters
              </Text>
            </Pressable>
          </View>
        ) : (
          filteredProviders.map((provider) => {
            const shared =
              sharedProviderIds.includes(
                provider.id
              );

            return (
              <VitalCard key={provider.id}>
                {/* Provider Header */}
                <View
                  style={styles.providerHeader}
                >
                  <View style={styles.avatar}>
                    <Text
                      style={styles.avatarText}
                    >
                      {getProviderInitials(
                        provider.name
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.providerHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.providerName
                      }
                    >
                      {provider.name}
                    </Text>

                    <Text
                      style={styles.specialty}
                    >
                      {provider.specialty}
                    </Text>
                  </View>
                </View>

                {/* Provider Information */}
                <View
                  style={styles.infoSection}
                >
                  <InformationRow
                    icon="🏥"
                    text={provider.facility}
                  />

                  <InformationRow
                    icon="📍"
                    text={`${provider.city}, ${provider.state} • ${provider.distance} mi`}
                  />

                  <InformationRow
                    icon="☎"
                    text={provider.phone}
                  />
                </View>

                {/* Sharing Status */}
                {shared ? (
                  <View
                    style={styles.sharedStatus}
                  >
                    <View
                      style={styles.sharedDot}
                    />

                    <Text
                      style={
                        styles.sharedStatusText
                      }
                    >
                      Health information shared
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.privateStatus
                    }
                  >
                    <View
                      style={styles.privateDot}
                    />

                    <Text
                      style={
                        styles.privateStatusText
                      }
                    >
                      No health data access
                    </Text>
                  </View>
                )}

                {/* Provider Actions */}
                <View style={styles.actionRow}>
                  <Pressable
                    style={
                      styles.secondaryButton
                    }
                    onPress={() =>
                      callProvider(
                        provider.phone
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${provider.name}`}
                  >
                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Call
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      styles.secondaryButton
                    }
                    onPress={() => {
                      /*
                       * Doctor details will be
                       * connected when provider
                       * database/API data is ready.
                       */
                      console.log(
                        'Provider details:',
                        provider
                      );
                    }}
                  >
                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      View Details
                    </Text>
                  </Pressable>
                </View>

                {/* Share / Revoke */}
                <Pressable
                  onPress={() =>
                    toggleSharing(provider.id)
                  }
                  style={
                    shared
                      ? styles.revokeButton
                      : styles.shareButton
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    shared
                      ? `Revoke health data access for ${provider.name}`
                      : `Share health information with ${provider.name}`
                  }
                >
                  <Text
                    style={
                      styles.shareButtonText
                    }
                  >
                    {shared
                      ? 'Revoke Health Data Access'
                      : 'Share Health Information'}
                  </Text>
                </Pressable>
              </VitalCard>
            );
          })
        )}

        {/* Prototype Notice */}
        <View style={styles.prototypeNotice}>
          <Text
            style={styles.prototypeTitle}
          >
            Provider directory prototype
          </Text>

          <Text
            style={styles.prototypeText}
          >
            Provider information shown here is
            temporary frontend sample data. The
            Doctor Referral page will use the
            VitalPilot provider database and API
            when those services are available.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DistanceButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={
        selected
          ? styles.distanceButtonSelected
          : styles.distanceButton
      }
    >
      <Text
        style={
          selected
            ? styles.distanceTextSelected
            : styles.distanceText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InformationRow({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>
        {icon}
      </Text>

      <Text style={styles.infoText}>
        {text}
      </Text>
    </View>
  );
}

function getProviderInitials(
  name: string
) {
  const cleanedName = name.replace(
    /^Dr\.\s*/i,
    ''
  );

  const parts = cleanedName
    .trim()
    .split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },

  /*
   * Navigation
   */

  navigationHeader: {
    minHeight: 58,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    minHeight: 44,

    flexDirection: 'row',
    alignItems: 'center',

    paddingRight: 14,
  },

  backArrow: {
    color: VitalPilotColors.primaryDark,

    fontSize: 31,
    lineHeight: 31,

    marginRight: 3,
  },

  backText: {
    color: VitalPilotColors.primaryDark,

    fontSize: 14,
    fontWeight: '700',
  },

  logoButton: {
    minHeight: 44,

    flexDirection: 'row',
    alignItems: 'center',

    paddingLeft: 10,
  },

  logo: {
    width: 35,
    height: 35,

    marginRight: 7,
  },

  logoText: {
    color: '#101828',

    fontSize: 18,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.6,
  },

  /*
   * Header
   */

  pageHeader: {
    gap: 5,
    marginBottom: 4,
  },

  title: {
    color: VitalPilotColors.title,

    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#667085',

    fontSize: 15,
    lineHeight: 22,
  },

  /*
   * Search
   */

  searchBox: {
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#D0D5DD',

    borderRadius: 16,

    paddingHorizontal: 14,
  },

  searchIcon: {
    marginRight: 8,

    fontSize: 16,
  },

  searchInput: {
    flex: 1,

    minHeight: 52,

    color: '#101828',

    fontSize: 14,
  },

  clearButton: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: '#F2F4F7',

    alignItems: 'center',
    justifyContent: 'center',
  },

  clearText: {
    color: '#667085',

    fontSize: 21,
  },

  /*
   * Filters
   */

  filterSection: {
    gap: 8,
  },

  filterTitle: {
    color: '#344054',

    fontSize: 13,
    fontWeight: '800',
  },

  specialtyRow: {
    gap: 8,
    paddingRight: 8,
  },

  filterChip: {
    borderWidth: 1,
    borderColor: '#D8E1DC',

    borderRadius: 18,

    paddingHorizontal: 13,
    paddingVertical: 8,

    backgroundColor: '#FFFFFF',
  },

  filterChipSelected: {
    borderWidth: 1,
    borderColor:
      VitalPilotColors.primary,

    borderRadius: 18,

    paddingHorizontal: 13,
    paddingVertical: 8,

    backgroundColor: '#ECF8F2',
  },

  filterText: {
    color: '#667085',

    fontSize: 12,
    fontWeight: '600',
  },

  filterTextSelected: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '800',
  },

  distanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 8,
  },

  distanceButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: '#D8E1DC',

    backgroundColor: '#FFFFFF',
  },

  distanceButtonSelected: {
    paddingHorizontal: 12,
    paddingVertical: 9,

    borderRadius: 12,

    borderWidth: 1,
    borderColor:
      VitalPilotColors.primary,

    backgroundColor: '#ECF8F2',
  },

  distanceText: {
    color: '#667085',

    fontSize: 12,
    fontWeight: '600',
  },

  distanceTextSelected: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '800',
  },

  /*
   * Privacy
   */

  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 12,

    backgroundColor: '#EEF8F2',

    borderRadius: 16,

    padding: 14,
  },

  privacyIcon: {
    width: 36,
    height: 36,

    borderRadius: 18,

    borderWidth: 2,
    borderColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  privacyIconText: {
    color:
      VitalPilotColors.primaryDark,

    fontWeight: '900',
  },

  privacyTextContainer: {
    flex: 1,
  },

  privacyTitle: {
    color: '#101828',

    fontSize: 12,
    fontWeight: '800',
  },

  privacyText: {
    color: '#52635B',

    fontSize: 11,
    lineHeight: 17,

    marginTop: 4,
  },

  /*
   * Results
   */

  resultsHeader: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    marginTop: 3,
  },

  resultsTitle: {
    color: '#101828',

    fontSize: 18,
    fontWeight: '800',
  },

  resultsCount: {
    color: '#667085',

    fontSize: 12,
  },

  /*
   * Provider card
   */

  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 12,
  },

  avatar: {
    width: 54,
    height: 54,

    borderRadius: 27,

    backgroundColor: '#E8F6EF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 17,
    fontWeight: '900',
  },

  providerHeaderText: {
    flex: 1,
  },

  providerName: {
    color:
      VitalPilotColors.title,

    fontSize: 17,
    fontWeight: '800',
  },

  specialty: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '700',

    marginTop: 3,
  },

  infoSection: {
    marginTop: 6,
    gap: 8,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    width: 30,

    fontSize: 14,
  },

  infoText: {
    flex: 1,

    color: '#667085',

    fontSize: 12,
    lineHeight: 18,
  },

  sharedStatus: {
    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#EAF8F0',

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 12,
  },

  sharedDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#15945C',

    marginRight: 6,
  },

  sharedStatusText: {
    color: '#137A53',

    fontSize: 11,
    fontWeight: '700',
  },

  privateStatus: {
    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#F2F4F7',

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 12,
  },

  privateDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#98A2B3',

    marginRight: 6,
  },

  privateStatusText: {
    color: '#667085',

    fontSize: 11,
    fontWeight: '600',
  },

  actionRow: {
    flexDirection: 'row',

    gap: 8,

    marginTop: 4,
  },

  secondaryButton: {
    flex: 1,

    minHeight: 42,

    borderWidth: 1,
    borderColor:
      VitalPilotColors.primary,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '700',
  },

  shareButton: {
    minHeight: 46,

    marginTop: 4,

    borderRadius: 12,

    backgroundColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 12,
  },

  revokeButton: {
    minHeight: 46,

    marginTop: 4,

    borderRadius: 12,

    backgroundColor: '#667085',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 12,
  },

  shareButtonText: {
    color: '#FFFFFF',

    fontSize: 13,
    fontWeight: '800',
  },

  /*
   * Empty State
   */

  emptyState: {
    alignItems: 'center',

    paddingHorizontal: 24,
    paddingVertical: 40,

    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#E2E8E5',
  },

  emptyIcon: {
    width: 54,
    height: 54,

    borderRadius: 27,

    backgroundColor: '#F2F7F4',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 12,
  },

  emptyIconText: {
    fontSize: 20,
  },

  emptyTitle: {
    color: '#101828',

    fontSize: 17,
    fontWeight: '800',
  },

  emptyText: {
    color: '#667085',

    textAlign: 'center',

    fontSize: 12,
    lineHeight: 19,

    marginTop: 6,
  },

  resetButton: {
    marginTop: 16,

    paddingHorizontal: 16,
    paddingVertical: 10,

    borderRadius: 12,

    backgroundColor: '#ECF8F2',
  },

  resetButtonText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '800',
  },

  /*
   * Prototype Notice
   */

  prototypeNotice: {
    backgroundColor: '#F8FAF9',

    borderWidth: 1,
    borderColor: '#E5EAE7',

    borderRadius: 14,

    padding: 14,

    marginTop: 4,
  },

  prototypeTitle: {
    color: '#344054',

    fontSize: 11,
    fontWeight: '800',
  },

  prototypeText: {
    color: '#667085',

    fontSize: 10,
    lineHeight: 16,

    marginTop: 4,
  },
});