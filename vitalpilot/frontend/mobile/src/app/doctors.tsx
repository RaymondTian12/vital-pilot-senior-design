import { useState } from 'react';
import {
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
  distance: string;
};

const providers: Provider[] = [
  {
    id: '1',
    name: 'Dr. Maya Chen',
    specialty: 'Cardiology',
    distance: '2.8 mi',
  },
  {
    id: '2',
    name: 'Dr. Daniel Brooks',
    specialty: 'Endocrinology',
    distance: '4.1 mi',
  },
];

export default function DoctorsScreen() {
  const [query, setQuery] = useState('');
  const [sharedProviderIds, setSharedProviderIds] = useState<string[]>([]);

  const filteredProviders = providers.filter((provider) => {
    const searchText = query.trim().toLowerCase();

    if (!searchText) {
      return true;
    }

    const providerText =
      `${provider.name} ${provider.specialty}`.toLowerCase();

    return providerText.includes(searchText);
  });

  function toggleSharing(providerId: string) {
    setSharedProviderIds((currentIds) => {
      const isAlreadyShared = currentIds.includes(providerId);

      if (isAlreadyShared) {
        return currentIds.filter(
          (id) => id !== providerId
        );
      }

      return [...currentIds, providerId];
    });
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Doctor Referral
          </Text>

          <Text style={styles.subtitle}>
            Search for a healthcare provider by name or specialty.
          </Text>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Cardiology, Endocrinology..."
          placeholderTextColor="#98A2B3"
          autoCapitalize="words"
          style={styles.input}
        />

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            Your health information is private
          </Text>

          <Text style={styles.noticeText}>
            Providers do not automatically receive access to your
            health information. Sharing requires your explicit
            authorization.
          </Text>
        </View>

        <View style={styles.providerList}>
          {filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => {
              const isShared =
                sharedProviderIds.includes(provider.id);

              return (
                <VitalCard key={provider.id}>
                  <Text style={styles.providerName}>
                    {provider.name}
                  </Text>

                  <Text style={styles.providerInfo}>
                    {provider.specialty} • {provider.distance}
                  </Text>

                  <Pressable
                    onPress={() =>
                      toggleSharing(provider.id)
                    }
                    style={({ pressed }) => [
                      styles.shareButton,
                      isShared && styles.revokeButton,
                      pressed && styles.pressedButton,
                    ]}
                  >
                    <Text style={styles.shareButtonText}>
                      {isShared
                        ? 'Revoke Health Data Access'
                        : 'Share Health Information'}
                    </Text>
                  </Pressable>
                </VitalCard>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                No providers found
              </Text>

              <Text style={styles.emptyText}>
                Try searching for another provider name or
                specialty.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FBF9',
  },

  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },

  header: {
    gap: 6,
  },

  title: {
    color: VitalPilotColors.title,
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    color: '#667085',
    fontSize: 16,
    lineHeight: 22,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: VitalPilotColors.title,
  },

  notice: {
    backgroundColor: VitalPilotColors.mintStrong,
    borderRadius: 16,
    padding: 14,
    gap: 5,
  },

  noticeTitle: {
    color: VitalPilotColors.title,
    fontSize: 14,
    fontWeight: '800',
  },

  noticeText: {
    color: '#4B6358',
    fontSize: 13,
    lineHeight: 19,
  },

  providerList: {
    gap: 14,
  },

  providerName: {
    color: VitalPilotColors.title,
    fontSize: 18,
    fontWeight: '800',
  },

  providerInfo: {
    color: '#667085',
    marginTop: 4,
  },

  shareButton: {
    marginTop: 14,
    backgroundColor: VitalPilotColors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  revokeButton: {
    backgroundColor: '#667085',
  },

  pressedButton: {
    opacity: 0.8,
  },

  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },

  emptyTitle: {
    color: VitalPilotColors.title,
    fontSize: 17,
    fontWeight: '800',
  },

  emptyText: {
    color: '#667085',
    textAlign: 'center',
    lineHeight: 20,
  },
});