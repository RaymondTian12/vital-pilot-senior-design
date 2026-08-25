import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';

type MetricCardProps = {
  icon: string;
  iconBackground: string;
  iconColor: string;

  label: string;

  value: string;
  unit?: string;

  status: string;

  bars: number[];
};

const trendSeries = {
  heart: [
    64,
    69,
    66,
    65,
    72,
    67,
    68,
  ],

  pressure: [
    111,
    118,
    119,
    126,
    124,
    116,
    120,
  ],

  sleep: [
    6.3,
    6.8,
    6.4,
    6.9,
    6.9,
    6.5,
    7.5,
  ],
};

const doctors = [
  {
    id: '1',

    name: 'Dr. Sarah Mitchell',
    specialty: 'Cardiologist',

    rating: '4.9',

    location: 'Arlington, TX',
  },

  {
    id: '2',

    name: 'Dr. James Lee',
    specialty: 'Endocrinologist',

    rating: '4.8',

    location: 'Arlington, TX',
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
        <View style={styles.topBar}>
          <View style={styles.headerText}>
            <Text style={styles.brand}>
              VitalPilot
            </Text>

            <Text style={styles.welcome}>
              👋 Welcome back,{' '}
              <Text style={styles.userName}>
                John Doe
              </Text>
            </Text>

            <Text style={styles.subtitle}>
              Here’s an overview of your health today.
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              JD
            </Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="♥"
            iconBackground="#EAF8F0"
            iconColor="#11915F"
            label="Heart Rate"
            value="72"
            unit="bpm"
            status="Normal"
            bars={[
              3,
              5,
              4,
              7,
              6,
              9,
            ]}
          />

          <MetricCard
            icon="💧"
            iconBackground="#EDF5FF"
            iconColor="#2E7EEA"
            label="Blood Pressure"
            value="120/80"
            unit="mmHg"
            status="Normal"
            bars={[
              3,
              4,
              6,
              4,
              7,
              6,
            ]}
          />

          <MetricCard
            icon="☾"
            iconBackground="#F4ECFF"
            iconColor="#8752D4"
            label="Sleep"
            value="7 h 30 m"
            status="Good"
            bars={[
              2,
              4,
              3,
              7,
              5,
              9,
            ]}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Vitals Overview
          </Text>

          <Pressable style={styles.rangeButton}>
            <Text style={styles.rangeText}>
              Last 7 days⌄
            </Text>
          </Pressable>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.legendRow}>
            <Legend
              color="#15945C"
              label="Heart Rate"
            />

            <Legend
              color="#2D7FE8"
              label="Blood Pressure"
            />

            <Legend
              color="#8654D5"
              label="Sleep"
            />
          </View>

          <View style={styles.chartBody}>
            <TrendRow
              color="#15945C"
              values={trendSeries.heart}
              max={130}
            />

            <TrendRow
              color="#2D7FE8"
              values={trendSeries.pressure}
              max={130}
            />

            <TrendRow
              color="#8654D5"
              values={trendSeries.sleep}
              max={10}
            />
          </View>

          <View style={styles.dayRow}>
            {[
              'M',
              'T',
              'W',
              'T',
              'F',
              'S',
              'S',
            ].map((day, index) => (
              <Text
                key={`${day}-${index}`}
                style={styles.dayLabel}
              >
                {day}
              </Text>
            ))}
          </View>

          <Pressable
            style={styles.inlineLink}
            onPress={() =>
              router.push('/metrics')
            }
          >
            <Text style={styles.inlineLinkText}>
              View all vitals →
            </Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.sectionTitle}>
              Health Summary
            </Text>

            <View style={styles.scoreRing}>
              <Text style={styles.score}>
                85
              </Text>

              <Text style={styles.scoreOutOf}>
                /100
              </Text>
            </View>
          </View>

          <Text style={styles.good}>
            Good
          </Text>

          <SummaryRow
            icon="⌁"
            label="Vitals"
            value="All normal"
          />

          <SummaryRow
            icon="↗"
            label="Activity"
            value="72% of goal"
          />

          <SummaryRow
            icon="☾"
            label="Sleep"
            value="7h 30m avg"
          />

          <SummaryRow
            icon="▣"
            label="Weight"
            value="68 kg"
          />

          <Pressable
            style={styles.inlineLink}
            onPress={() =>
              router.push('/reports')
            }
          >
            <Text style={styles.inlineLinkText}>
              View full summary →
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Recommended Doctors For You
          </Text>

          <Pressable
            onPress={() =>
              router.push('/doctors')
            }
          >
            <Text style={styles.viewAll}>
              View all
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.doctorRow
          }
        >
          {doctors.map((doctor) => (
            <View
              key={doctor.id}
              style={styles.doctorCard}
            >
              <Image
                source={require('../../../assets/images/vitalpilot/doctor_profile.png')}
                style={styles.doctorImage}
                contentFit="cover"
              />

              <View style={styles.doctorText}>
                <Text style={styles.doctorName}>
                  {doctor.name}
                </Text>

                <Text style={styles.doctorSpecialty}>
                  {doctor.specialty}
                </Text>

                <Text style={styles.doctorMeta}>
                  ★ {doctor.rating}
                  {'  ·  '}
                  {doctor.location}
                </Text>
              </View>

              <Pressable
                style={styles.bookButton}
                onPress={() =>
                  router.push('/doctors')
                }
              >
                <Text style={styles.bookButtonText}>
                  View Provider
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}>
            <Text style={styles.privacyIconText}>
              ✓
            </Text>
          </View>

          <View style={styles.privacyTextWrap}>
            <Text style={styles.privacyTitle}>
              Your health is our priority
            </Text>

            <Text style={styles.privacyText}>
              Your information stays private.
              Provider sharing happens only after
              your authorization.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  iconBackground,
  iconColor,
  label,
  value,
  unit,
  status,
  bars,
}: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View
          style={[
            styles.metricIcon,
            {
              backgroundColor:
                iconBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.metricIconText,
              {
                color: iconColor,
              },
            ]}
          >
            {icon}
          </Text>
        </View>

        <Text style={styles.metricLabel}>
          {label}
        </Text>
      </View>

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>
          {value}
        </Text>

        {unit ? (
          <Text style={styles.metricUnit}>
            {unit}
          </Text>
        ) : null}
      </View>

      <View style={styles.metricFooter}>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />

          <Text style={styles.statusText}>
            {status}
          </Text>
        </View>

        <MiniBars
          bars={bars}
          color={iconColor}
        />
      </View>
    </View>
  );
}

function MiniBars({
  bars,
  color,
}: {
  bars: number[];
  color: string;
}) {
  return (
    <View style={styles.miniBars}>
      {bars.map((height, index) => (
        <View
          key={`${height}-${index}`}
          style={[
            styles.miniBar,
            {
              height: height * 3,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendLine,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

function TrendRow({
  color,
  values,
  max,
}: {
  color: string;
  values: number[];
  max: number;
}) {
  return (
    <View style={styles.trendRow}>
      {values.map((value, index) => (
        <View
          key={`${value}-${index}`}
          style={styles.trendPointColumn}
        >
          <View
            style={[
              styles.trendStem,
              {
                height: Math.max(
                  8,
                  (value / max) * 58
                ),
                backgroundColor: color,
              },
            ]}
          />

          <View
            style={[
              styles.trendDot,
              {
                backgroundColor: color,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryIcon}>
        {icon}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.chevron}>
        ›
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },

  content: {
    padding: 20,

    paddingBottom:
      BottomTabInset + 36,

    gap: 18,
  },

  topBar: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',

    gap: 14,
  },

  headerText: {
    flex: 1,
  },

  brand: {
    color: '#101828',

    fontSize: 18,
    fontWeight: '800',

    marginBottom: 18,
  },

  welcome: {
    color: '#101828',

    fontSize: 25,
    fontWeight: '800',

    lineHeight: 31,
  },

  userName: {
    color: VitalPilotColors.primaryDark,
  },

  subtitle: {
    color: '#667085',

    fontSize: 14,

    marginTop: 5,
  },

  avatar: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: '#E9F6EF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: VitalPilotColors.primaryDark,

    fontWeight: '800',
  },

  metricsGrid: {
    gap: 12,
  },

  metricCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#E2E8E5',

    padding: 16,

    gap: 12,
  },

  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,
  },

  metricIcon: {
    width: 40,
    height: 40,

    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',
  },

  metricIconText: {
    fontSize: 18,
    fontWeight: '900',
  },

  metricLabel: {
    color: '#475467',

    fontSize: 14,
    fontWeight: '600',
  },

  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',

    gap: 5,
  },

  metricValue: {
    color: '#101828',

    fontSize: 27,
    fontWeight: '900',
  },

  metricUnit: {
    color: '#475467',

    fontSize: 12,
    fontWeight: '600',
  },

  metricFooter: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,
  },

  statusDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#15945C',
  },

  statusText: {
    color: '#15945C',

    fontSize: 12,
    fontWeight: '600',
  },

  miniBars: {
    height: 30,

    flexDirection: 'row',
    alignItems: 'flex-end',

    gap: 3,
  },

  miniBar: {
    width: 4,

    borderRadius: 2,

    opacity: 0.8,
  },

  sectionHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    color: '#101828',

    fontSize: 19,
    fontWeight: '800',
  },

  rangeButton: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E0E6E3',

    borderRadius: 10,

    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  rangeText: {
    color: '#344054',

    fontSize: 12,
    fontWeight: '600',
  },

  chartCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#E2E8E5',

    padding: 16,

    gap: 16,
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 14,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,
  },

  legendLine: {
    width: 13,
    height: 3,

    borderRadius: 2,
  },

  legendText: {
    color: '#667085',
    fontSize: 11,
  },

  chartBody: {
    height: 180,

    justifyContent: 'space-around',

    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },

  trendRow: {
    height: 52,

    flexDirection: 'row',
    alignItems: 'flex-end',

    justifyContent: 'space-between',
  },

  trendPointColumn: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  trendStem: {
    width: 2,

    opacity: 0.35,
  },

  trendDot: {
    width: 7,
    height: 7,

    borderRadius: 4,
  },

  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dayLabel: {
    flex: 1,

    textAlign: 'center',

    color: '#98A2B3',

    fontSize: 10,
  },

  inlineLink: {
    alignSelf: 'center',

    backgroundColor: '#EEF8F2',

    borderRadius: 10,

    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  inlineLinkText: {
    color: VitalPilotColors.primaryDark,

    fontWeight: '700',
    fontSize: 12,
  },

  summaryCard: {
    backgroundColor: '#F8FCF9',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#E0EAE4',

    padding: 18,

    gap: 10,
  },

  summaryTopRow: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',
  },

  scoreRing: {
    width: 92,
    height: 92,

    borderRadius: 46,

    borderWidth: 7,
    borderColor: '#15945C',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFFFFF',
  },

  score: {
    color: '#101828',

    fontSize: 28,
    fontWeight: '900',
  },

  scoreOutOf: {
    color: '#667085',

    fontSize: 11,
  },

  good: {
    color: '#15945C',

    textAlign: 'right',

    fontWeight: '800',

    marginTop: -4,
    marginRight: 24,
  },

  summaryRow: {
    minHeight: 48,

    backgroundColor: '#FFFFFF',

    borderRadius: 11,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 12,

    gap: 9,
  },

  summaryIcon: {
    color: VitalPilotColors.primary,

    fontSize: 17,

    width: 22,
  },

  summaryLabel: {
    flex: 1,

    color: '#344054',

    fontSize: 13,
    fontWeight: '600',
  },

  summaryValue: {
    color: '#667085',

    fontSize: 12,
  },

  chevron: {
    color: '#98A2B3',

    fontSize: 20,
  },

  viewAll: {
    color: VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '700',
  },

  doctorRow: {
    gap: 12,

    paddingRight: 6,
  },

  doctorCard: {
    width: 285,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 18,

    padding: 16,

    gap: 12,
  },

  doctorImage: {
    width: 70,
    height: 70,

    borderRadius: 35,

    backgroundColor: '#EEF4F1',
  },

  doctorText: {
    gap: 3,
  },

  doctorName: {
    color: '#101828',

    fontSize: 16,
    fontWeight: '800',
  },

  doctorSpecialty: {
    color: '#667085',

    fontSize: 13,
  },

  doctorMeta: {
    color: '#667085',

    fontSize: 12,

    marginTop: 5,
  },

  bookButton: {
    minHeight: 44,

    borderWidth: 1,
    borderColor: VitalPilotColors.primary,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',
  },

  bookButtonText: {
    color: VitalPilotColors.primaryDark,

    fontWeight: '700',
    fontSize: 13,
  },

  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 14,

    backgroundColor: '#F6FBF8',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#DEEAE3',

    padding: 16,
  },

  privacyIcon: {
    width: 44,
    height: 44,

    borderRadius: 22,

    borderWidth: 2,
    borderColor: VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  privacyIconText: {
    color: VitalPilotColors.primaryDark,

    fontSize: 19,
    fontWeight: '900',
  },

  privacyTextWrap: {
    flex: 1,
  },

  privacyTitle: {
    color: '#101828',

    fontWeight: '800',

    marginBottom: 4,
  },

  privacyText: {
    color: '#667085',

    fontSize: 12,
    lineHeight: 18,
  },
});