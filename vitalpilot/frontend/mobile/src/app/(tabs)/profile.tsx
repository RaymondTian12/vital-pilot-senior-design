import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalButton } from '@/components/vitalpilot/button';
import { VitalCard } from '@/components/vitalpilot/card';
import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState('VitalPilot Patient');
  const [email, setEmail] = useState('patient@example.com');

  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [weeklySummaries, setWeeklySummaries] = useState(true);

  const [message, setMessage] = useState('');

  function saveProfile() {
    if (!name.trim() || !email.trim()) {
      setMessage('Please complete your name and email.');
      return;
    }

    if (!email.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    const profileData = {
      name: name.trim(),
      email: email.trim(),
      notifications: {
        criticalAlerts,
        weeklySummaries,
      },
    };

    console.log('VitalPilot profile:', profileData);

    setMessage('Profile saved successfully.');
  }

  function signOut() {
    router.replace('/welcome');
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Patient Information
        </Text>

        <VitalCard>
          <Text style={styles.cardTitle}>
            Profile
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#98A2B3"
            autoCapitalize="words"
            style={styles.input}
          />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#98A2B3"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />

          {message ? (
            <Text style={styles.message}>
              {message}
            </Text>
          ) : null}

          <VitalButton onPress={saveProfile}>
            Save Profile
          </VitalButton>
        </VitalCard>

        <VitalCard>
          <Text style={styles.cardTitle}>
            Notifications
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>
                Critical health alerts
              </Text>

              <Text style={styles.settingDescription}>
                Receive alerts when important health values
                require attention.
              </Text>
            </View>

            <Switch
              value={criticalAlerts}
              onValueChange={setCriticalAlerts}
              trackColor={{
                false: '#D0D5DD',
                true: VitalPilotColors.mintStrong,
              }}
              thumbColor={
                criticalAlerts
                  ? VitalPilotColors.primary
                  : '#F2F4F7'
              }
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>
                Weekly summaries
              </Text>

              <Text style={styles.settingDescription}>
                Receive summaries of your recent health
                measurements and trends.
              </Text>
            </View>

            <Switch
              value={weeklySummaries}
              onValueChange={setWeeklySummaries}
              trackColor={{
                false: '#D0D5DD',
                true: VitalPilotColors.mintStrong,
              }}
              thumbColor={
                weeklySummaries
                  ? VitalPilotColors.primary
                  : '#F2F4F7'
              }
            />
          </View>
        </VitalCard>

        <VitalButton
          variant="secondary"
          onPress={signOut}
        >
          Sign Out
        </VitalButton>
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
    paddingBottom: BottomTabInset + 32,
    gap: 14,
  },

  title: {
    color: VitalPilotColors.title,
    fontSize: 28,
    fontWeight: '800',
  },

  cardTitle: {
    color: VitalPilotColors.title,
    fontSize: 18,
    fontWeight: '800',
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    color: VitalPilotColors.title,
    fontSize: 16,
  },

  message: {
    color: '#667085',
    fontSize: 14,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    gap: 14,
  },

  settingText: {
    flex: 1,
    gap: 4,
  },

  settingLabel: {
    color: VitalPilotColors.title,
    fontWeight: '700',
  },

  settingDescription: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: VitalPilotColors.border,
  },
});