import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalButton } from '@/components/vitalpilot/button';
import { VitalPilotLogo } from '@/components/vitalpilot/logo';
import { VitalPilotColors } from '@/constants/vitalpilot';

const metrics = [
  'Blood Pressure',
  'Blood Glucose',
  'Blood Oxygen',
  'Peak Flow',
  'Sleep',
  'Physical Activity',
  'Water Intake',
  'Weight',
];

export default function QuestionnaireScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'Blood Pressure',
    'Blood Glucose',
  ]);

  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [loggingReminders, setLoggingReminders] = useState(true);
  const [weeklySummaries, setWeeklySummaries] = useState(true);
  const [milestoneNotifications, setMilestoneNotifications] =
    useState(true);

  const [error, setError] = useState('');

  function toggleMetric(metric: string) {
    setSelectedMetrics((currentMetrics) => {
      if (currentMetrics.includes(metric)) {
        return currentMetrics.filter(
          (currentMetric) => currentMetric !== metric
        );
      }

      return [...currentMetrics, metric];
    });
  }

  function goToMetricSelection() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }

    setError('');
    setStep(2);
  }

  function goToNotificationPreferences() {
    if (selectedMetrics.length === 0) {
      setError('Please select at least one health metric.');
      return;
    }

    setError('');
    setStep(3);
  }

  function finishSetup() {
    const onboardingData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      selectedMetrics,
      notifications: {
        criticalAlerts,
        loggingReminders,
        weeklySummaries,
        milestoneNotifications,
      },
    };

    console.log('VitalPilot onboarding data:', onboardingData);

    router.replace('/home');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <VitalPilotLogo size={38} />

        <View style={styles.progressRow}>
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              style={[
                styles.progress,
                item <= step && styles.progressActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.stepLabel}>STEP 1 OF 3</Text>

            <Text style={styles.title}>
              Tell us about yourself
            </Text>

            <Text style={styles.subtitle}>
              This helps personalize your VitalPilot experience.
            </Text>

            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor="#98A2B3"
              autoCapitalize="words"
              style={styles.input}
            />

            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor="#98A2B3"
              autoCapitalize="words"
              style={styles.input}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <VitalButton onPress={goToMetricSelection}>
              Next
            </VitalButton>
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.stepLabel}>STEP 2 OF 3</Text>

            <Text style={styles.title}>
              Choose health metrics
            </Text>

            <Text style={styles.subtitle}>
              Select the information you want VitalPilot to help
              you monitor.
            </Text>

            <View style={styles.metricGrid}>
              {metrics.map((metric) => {
                const selected =
                  selectedMetrics.includes(metric);

                return (
                  <Pressable
                    key={metric}
                    onPress={() => toggleMetric(metric)}
                    style={({ pressed }) => [
                      styles.metricChoice,
                      selected &&
                        styles.metricChoiceSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.metricText,
                        selected &&
                          styles.metricTextSelected,
                      ]}
                    >
                      {selected ? '✓ ' : ''}
                      {metric}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <VitalButton
              onPress={goToNotificationPreferences}
            >
              Next
            </VitalButton>

            <VitalButton
              variant="secondary"
              onPress={() => {
                setError('');
                setStep(1);
              }}
            >
              Back
            </VitalButton>
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.stepLabel}>STEP 3 OF 3</Text>

            <Text style={styles.title}>
              Notification preferences
            </Text>

            <Text style={styles.subtitle}>
              Choose which VitalPilot notifications you would
              like to receive. You can change these later in
              your profile.
            </Text>

            <View style={styles.notificationCard}>
              <NotificationRow
                title="Critical health alerts"
                description="Receive alerts when important health measurements require attention."
                value={criticalAlerts}
                onValueChange={setCriticalAlerts}
              />

              <NotificationRow
                title="Logging reminders"
                description="Receive reminders to record your health information."
                value={loggingReminders}
                onValueChange={setLoggingReminders}
              />

              <NotificationRow
                title="Weekly summaries"
                description="Receive a summary of your recent health activity and trends."
                value={weeklySummaries}
                onValueChange={setWeeklySummaries}
              />

              <NotificationRow
                title="Milestone notifications"
                description="Receive updates when you reach health goals or streak milestones."
                value={milestoneNotifications}
                onValueChange={setMilestoneNotifications}
              />
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>
                Selected metrics
              </Text>

              <Text style={styles.summaryText}>
                {selectedMetrics.join(', ')}
              </Text>
            </View>

            <VitalButton onPress={finishSetup}>
              Finish Setup
            </VitalButton>

            <VitalButton
              variant="secondary"
              onPress={() => setStep(2)}
            >
              Back
            </VitalButton>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type NotificationRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function NotificationRow({
  title,
  description,
  value,
  onValueChange,
}: NotificationRowProps) {
  return (
    <View style={styles.notificationRow}>
      <View style={styles.notificationText}>
        <Text style={styles.notificationTitle}>
          {title}
        </Text>

        <Text style={styles.notificationDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: '#D0D5DD',
          true: VitalPilotColors.mintStrong,
        }}
        thumbColor={
          value
            ? VitalPilotColors.primary
            : '#F2F4F7'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FCFA',
  },

  header: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: VitalPilotColors.border,
  },

  progressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },

  progress: {
    flex: 1,
    height: 6,
    backgroundColor: '#E4ECE8',
    borderRadius: 10,
  },

  progressActive: {
    backgroundColor: VitalPilotColors.primary,
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  section: {
    gap: 14,
  },

  stepLabel: {
    color: VitalPilotColors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  title: {
    color: VitalPilotColors.title,
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    color: '#667085',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },

  input: {
    minHeight: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: VitalPilotColors.title,
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },

  metricChoice: {
    width: '48%',
    minHeight: 74,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VitalPilotColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },

  metricChoiceSelected: {
    backgroundColor: VitalPilotColors.mintStrong,
    borderColor: VitalPilotColors.primary,
  },

  metricText: {
    color: VitalPilotColors.title,
    textAlign: 'center',
    fontWeight: '600',
  },

  metricTextSelected: {
    color: VitalPilotColors.primaryDark,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.8,
  },

  errorText: {
    color: VitalPilotColors.danger,
    fontSize: 14,
  },

  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: VitalPilotColors.border,
    borderRadius: 18,
    overflow: 'hidden',
  },

  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: VitalPilotColors.border,
    gap: 14,
  },

  notificationText: {
    flex: 1,
    gap: 4,
  },

  notificationTitle: {
    color: VitalPilotColors.title,
    fontSize: 15,
    fontWeight: '700',
  },

  notificationDescription: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },

  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: VitalPilotColors.border,
    gap: 8,
    marginBottom: 8,
  },

  summaryTitle: {
    color: VitalPilotColors.title,
    fontWeight: '800',
  },

  summaryText: {
    color: '#667085',
    lineHeight: 22,
  },
});