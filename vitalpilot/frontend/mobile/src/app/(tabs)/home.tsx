import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalButton } from '@/components/vitalpilot/button';
import { VitalCard } from '@/components/vitalpilot/card';
import { VitalPilotLogo } from '@/components/vitalpilot/logo';
import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';

type HealthMetric = {
  label: string;
  value: string;
  unit: string;
  status: string;
};

const healthMetrics: HealthMetric[] = [
  {
    label: 'Blood Pressure',
    value: '128/82',
    unit: 'mmHg',
    status: 'Stable this week',
  },
  {
    label: 'Blood Glucose',
    value: '102',
    unit: 'mg/dL',
    status: '4% lower this week',
  },
  {
    label: 'Blood Oxygen',
    value: '98',
    unit: '%',
    status: 'Within target range',
  },
  {
    label: 'Sleep',
    value: '7.4',
    unit: 'hours',
    status: 'Near your daily goal',
  },
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              Good afternoon
            </Text>

            <Text style={styles.title}>
              Your Health Dashboard
            </Text>
          </View>

          <VitalPilotLogo size={48} />
        </View>

        <View style={styles.alert}>
          <Text style={styles.alertTitle}>
            Weekly health trend ready
          </Text>

          <Text style={styles.alertText}>
            Review your latest measurements and progress.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.actionButton}>
            <VitalButton
              onPress={() => router.push('/metrics')}
            >
              Log Health Data
            </VitalButton>
          </View>

          <View style={styles.actionButton}>
            <VitalButton
              variant="secondary"
              onPress={() => router.push('/chatbot')}
            >
              Ask Pilot AI
            </VitalButton>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Health Metrics
        </Text>

        <View style={styles.grid}>
          {healthMetrics.map((metric) => (
            <VitalCard
              key={metric.label}
              style={styles.metricCard}
            >
              <Text style={styles.metricLabel}>
                {metric.label}
              </Text>

              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>
                  {metric.value}
                </Text>

                <Text style={styles.metricUnit}>
                  {metric.unit}
                </Text>
              </View>

              <Text style={styles.metricStatus}>
                {metric.status}
              </Text>
            </VitalCard>
          ))}
        </View>

        <VitalCard>
          <Text style={styles.metricLabel}>
            Healthy Habit Streak
          </Text>

          <Text style={styles.streak}>
            ★ 4 Days
          </Text>

          <Text style={styles.metricStatus}>
            Keep logging your daily health information.
          </Text>
        </VitalCard>

        <VitalButton
          variant="secondary"
          onPress={() => router.push('/doctors')}
        >
          Find a Doctor
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
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: '#667085',
    fontSize: 14,
  },

  title: {
    color: VitalPilotColors.title,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },

  alert: {
    backgroundColor: VitalPilotColors.mintStrong,
    borderRadius: 18,
    padding: 16,
  },

  alertTitle: {
    color: VitalPilotColors.title,
    fontWeight: '800',
    marginBottom: 4,
  },

  alertText: {
    color: '#4B6358',
    lineHeight: 20,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  actionButton: {
    flex: 1,
  },

  sectionTitle: {
    color: VitalPilotColors.title,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 4,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  metricCard: {
    width: '48%',
  },

  metricLabel: {
    color: VitalPilotColors.title,
    fontWeight: '700',
  },

  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },

  metricValue: {
    color: VitalPilotColors.title,
    fontSize: 24,
    fontWeight: '900',
  },

  metricUnit: {
    color: '#667085',
    fontSize: 12,
  },

  metricStatus: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },

  streak: {
    color: VitalPilotColors.primaryDark,
    fontSize: 25,
    fontWeight: '900',
  },
});