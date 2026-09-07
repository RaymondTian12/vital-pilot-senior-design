import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationBell } from '@/components/notifications/notification-bell';
import { useNotifications } from '@/context/notification-context';
import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';

type TrendPeriod = '7 Days' | '30 Days';

type MetricCard = {
  id: string;
  title: string;
  value: string;
  unit: string;
  status: string;
  icon: string;

  accent: string;
  softBackground: string;

  values: number[];

  route: '/metrics';
};

const metricCards: MetricCard[] = [
  {
    id: 'heart-rate',
    title: 'Heart Rate',
    value: '72',
    unit: 'bpm',
    status: 'Normal',
    icon: '♥',

    accent: '#15945C',
    softBackground: '#EAF8F0',

    values: [58, 64, 62, 70, 68, 75, 72],

    route: '/metrics',
  },

  {
    id: 'blood-pressure',
    title: 'Blood Pressure',
    value: '120/80',
    unit: 'mmHg',
    status: 'Normal',
    icon: '◉',

    accent: '#2E7EEA',
    softBackground: '#EAF2FF',

    values: [60, 68, 64, 72, 67, 74, 70],

    route: '/metrics',
  },

  {
    id: 'sleep',
    title: 'Sleep',
    value: '7h 30m',
    unit: '',
    status: 'Good',
    icon: '☾',

    accent: '#8752D4',
    softBackground: '#F1EBFC',

    values: [54, 61, 58, 70, 64, 72, 76],

    route: '/metrics',
  },

  {
    id: 'glucose',
    title: 'Blood Glucose',
    value: '102',
    unit: 'mg/dL',
    status: 'Normal',
    icon: '◇',

    accent: '#F79009',
    softBackground: '#FFF4E5',

    values: [67, 73, 69, 76, 70, 72, 68],

    route: '/metrics',
  },
];

const overviewData = [
  {
    day: 'Mon',
    heartRate: 65,
    bloodPressure: 72,
    sleep: 62,
  },
  {
    day: 'Tue',
    heartRate: 72,
    bloodPressure: 78,
    sleep: 68,
  },
  {
    day: 'Wed',
    heartRate: 67,
    bloodPressure: 76,
    sleep: 63,
  },
  {
    day: 'Thu',
    heartRate: 70,
    bloodPressure: 82,
    sleep: 70,
  },
  {
    day: 'Fri',
    heartRate: 76,
    bloodPressure: 79,
    sleep: 69,
  },
  {
    day: 'Sat',
    heartRate: 69,
    bloodPressure: 75,
    sleep: 65,
  },
  {
    day: 'Sun',
    heartRate: 72,
    bloodPressure: 77,
    sleep: 71,
  },
];

const doctors = [
  {
    id: '1',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Cardiologist',
    location: 'Arlington, TX',
    rating: '4.9',
  },

  {
    id: '2',
    name: 'Dr. James Lee',
    specialty: 'Endocrinologist',
    location: 'Arlington, TX',
    rating: '4.8',
  },

  {
    id: '3',
    name: 'Dr. Aisha Brown',
    specialty: 'Primary Care',
    location: 'Arlington, TX',
    rating: '4.8',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const {
    unreadCount,
    notifications,
  } = useNotifications();

  const [trendPeriod, setTrendPeriod] =
    useState<TrendPeriod>('7 Days');

  const latestNotification =
    notifications.find(
      (notification) => !notification.read
    ) ?? notifications[0];

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top navigation */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() =>
              router.replace('/home')
            }
            style={({ pressed }) => [
              styles.logoButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go to VitalPilot home"
          >
            <Image
              source={require('../../../assets/images/vitalpilot/logo_green.png')}
              style={styles.logo}
              contentFit="contain"
            />

            <Text style={styles.logoText}>
              VitalPilot
            </Text>
          </Pressable>

          <View style={styles.headerActions}>
            <NotificationBell
              count={unreadCount}
              onPress={() =>
                router.push('/notifications')
              }
            />

            <Pressable
              onPress={() =>
                router.push('/profile')
              }
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open patient profile"
            >
              <View
                style={styles.profileAvatar}
              >
                <Text
                  style={
                    styles.profileInitials
                  }
                >
                  JD
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            👋 Welcome back,{' '}
            <Text style={styles.userName}>
              John
            </Text>
          </Text>

          <Text
            style={styles.greetingSubtitle}
          >
            Here's an overview of your health
            today.
          </Text>
        </View>

        {/* Notification summary */}
        {unreadCount > 0 &&
        latestNotification ? (
          <Pressable
            onPress={() =>
              router.push('/notifications')
            }
            style={({ pressed }) => [
              styles.notificationSummary,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={
                styles.notificationSummaryIcon
              }
            >
              <Text
                style={
                  styles.notificationSummaryIconText
                }
              >
                !
              </Text>
            </View>

            <View
              style={
                styles.notificationSummaryContent
              }
            >
              <Text
                style={
                  styles.notificationSummaryLabel
                }
              >
                {unreadCount}{' '}
                {unreadCount === 1
                  ? 'NEW NOTIFICATION'
                  : 'NEW NOTIFICATIONS'}
              </Text>

              <Text
                style={
                  styles.notificationSummaryTitle
                }
              >
                {latestNotification.title}
              </Text>

              <Text
                numberOfLines={2}
                style={
                  styles.notificationSummaryMessage
                }
              >
                {latestNotification.message}
              </Text>
            </View>

            <Text
              style={
                styles.notificationSummaryArrow
              }
            >
              ›
            </Text>
          </Pressable>
        ) : null}

        {/* Today's Health */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Today's Health
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Your latest health measurements.
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push('/metrics')
            }
          >
            <Text style={styles.viewAll}>
              View all
            </Text>
          </Pressable>
        </View>

        {/* Metric cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.metricScroll
          }
        >
          {metricCards.map((metric) => (
            <Pressable
              key={metric.id}
              onPress={() =>
                router.push(metric.route)
              }
              style={({ pressed }) => [
                styles.metricCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.metricHeader}>
                <View
                  style={[
                    styles.metricIcon,
                    {
                      backgroundColor:
                        metric.softBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.metricIconText,
                      {
                        color:
                          metric.accent,
                      },
                    ]}
                  >
                    {metric.icon}
                  </Text>
                </View>

                <View
                  style={[
                    styles.normalBadge,
                    {
                      backgroundColor:
                        metric.softBackground,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.normalDot,
                      {
                        backgroundColor:
                          metric.accent,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.normalText,
                      {
                        color:
                          metric.accent,
                      },
                    ]}
                  >
                    {metric.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.metricTitle}>
                {metric.title}
              </Text>

              <View
                style={styles.metricValueRow}
              >
                <Text style={styles.metricValue}>
                  {metric.value}
                </Text>

                {metric.unit ? (
                  <Text
                    style={styles.metricUnit}
                  >
                    {metric.unit}
                  </Text>
                ) : null}
              </View>

              <MiniTrend
                values={metric.values}
                color={metric.accent}
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Vitals Overview */}
        <View style={styles.dashboardCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.cardTitle}>
                Vitals Overview
              </Text>

              <Text style={styles.cardSubtitle}>
                Recent health trends
              </Text>
            </View>

            <View style={styles.periodSelector}>
              <Pressable
                onPress={() =>
                  setTrendPeriod('7 Days')
                }
                style={
                  trendPeriod === '7 Days'
                    ? styles.periodSelected
                    : styles.periodButton
                }
              >
                <Text
                  style={
                    trendPeriod === '7 Days'
                      ? styles.periodTextSelected
                      : styles.periodText
                  }
                >
                  7 Days
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setTrendPeriod('30 Days')
                }
                style={
                  trendPeriod === '30 Days'
                    ? styles.periodSelected
                    : styles.periodButton
                }
              >
                <Text
                  style={
                    trendPeriod === '30 Days'
                      ? styles.periodTextSelected
                      : styles.periodText
                  }
                >
                  30 Days
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.legend}>
            <LegendItem
              label="Heart Rate"
              color="#15945C"
            />

            <LegendItem
              label="Blood Pressure"
              color="#2E7EEA"
            />

            <LegendItem
              label="Sleep"
              color="#8752D4"
            />
          </View>

          <VitalsChart />

          <Pressable
            onPress={() =>
              router.push('/metrics')
            }
            style={styles.chartAction}
          >
            <Text
              style={
                styles.chartActionText
              }
            >
              View all vitals
            </Text>

            <Text
              style={
                styles.chartActionArrow
              }
            >
              →
            </Text>
          </Pressable>
        </View>

        {/* Health Summary */}
        <View style={styles.dashboardCard}>
          <View
            style={
              styles.sectionHeaderCompact
            }
          >
            <View>
              <Text style={styles.cardTitle}>
                Health Summary
              </Text>

              <Text
                style={styles.cardSubtitle}
              >
                Your current health overview
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push('/reports')
              }
            >
              <Text style={styles.viewAll}>
                Full report
              </Text>
            </Pressable>
          </View>

          <View
            style={styles.healthScoreSection}
          >
            <View style={styles.scoreOuter}>
              <View style={styles.scoreInner}>
                <Text
                  style={styles.scoreValue}
                >
                  85
                </Text>

                <Text
                  style={styles.scoreTotal}
                >
                  /100
                </Text>
              </View>
            </View>

            <Text style={styles.scoreStatus}>
              Good
            </Text>

            <Text
              style={styles.scoreDescription}
            >
              Most of your tracked health
              measurements are within your
              expected ranges.
            </Text>
          </View>

          <View style={styles.summaryRows}>
            <SummaryRow
              icon="♥"
              title="Vitals"
              value="All normal"
              color="#15945C"
              background="#EAF8F0"
            />

            <SummaryRow
              icon="↗"
              title="Activity"
              value="72% of goal"
              color="#12B0A0"
              background="#E8F8F6"
            />

            <SummaryRow
              icon="☾"
              title="Sleep"
              value="7h 30m avg"
              color="#8752D4"
              background="#F1EBFC"
            />

            <SummaryRow
              icon="▣"
              title="Weight"
              value="68 kg"
              color="#5D6BD8"
              background="#EEF0FF"
            />
          </View>

          <Pressable
            onPress={() =>
              router.push('/reports')
            }
            style={
              styles.fullSummaryButton
            }
          >
            <Text
              style={styles.fullSummaryText}
            >
              View full health summary
            </Text>

            <Text
              style={styles.fullSummaryArrow}
            >
              →
            </Text>
          </Pressable>
        </View>

        {/* Pilot AI */}
        <Pressable
          onPress={() =>
            router.push('/chatbot')
          }
          style={({ pressed }) => [
            styles.aiCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.aiIcon}>
            <Text style={styles.aiIconText}>
              ✦
            </Text>
          </View>

          <View style={styles.aiContent}>
            <Text style={styles.aiLabel}>
              PILOT AI
            </Text>

            <Text style={styles.aiTitle}>
              Have questions about your health?
            </Text>

            <Text
              style={styles.aiDescription}
            >
              Ask Pilot AI to explain your
              vitals, reports, or recent health
              trends.
            </Text>
          </View>

          <Text style={styles.aiArrow}>
            ›
          </Text>
        </Pressable>

        {/* Recommended doctors */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Recommended Doctors
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Providers that may fit your care
              needs.
            </Text>
          </View>

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
            styles.doctorScroll
          }
        >
          {doctors.map((doctor) => (
            <Pressable
              key={doctor.id}
              onPress={() =>
                router.push('/doctors')
              }
              style={({ pressed }) => [
                styles.doctorCard,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={
                  styles.doctorPhotoContainer
                }
              >
                <Image
                  source={require('../../../assets/images/vitalpilot/doctor_profile.png')}
                  style={styles.doctorPhoto}
                  contentFit="cover"
                />
              </View>

              <Text
                style={styles.doctorName}
              >
                {doctor.name}
              </Text>

              <Text
                style={
                  styles.doctorSpecialty
                }
              >
                {doctor.specialty}
              </Text>

              <View style={styles.ratingRow}>
                <Text style={styles.star}>
                  ★
                </Text>

                <Text style={styles.rating}>
                  {doctor.rating}
                </Text>
              </View>

              <Text
                style={
                  styles.doctorLocation
                }
              >
                📍 {doctor.location}
              </Text>

              <View
                style={styles.doctorButton}
              >
                <Text
                  style={
                    styles.doctorButtonText
                  }
                >
                  View Provider
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Alerts & Notifications */}
        <Pressable
          onPress={() =>
            router.push('/notifications')
          }
          style={({ pressed }) => [
            styles.alertCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.alertIcon}>
            <Text
              style={styles.alertIconText}
            >
              !
            </Text>
          </View>

          <View style={styles.alertContent}>
            <Text
              style={styles.alertTitle}
            >
              Alerts & Notifications
            </Text>

            <Text
              style={
                styles.alertDescription
              }
            >
              {unreadCount > 0
                ? `You have ${unreadCount} unread ${
                    unreadCount === 1
                      ? 'notification'
                      : 'notifications'
                  } waiting for review.`
                : 'You have no unread notifications.'}
            </Text>
          </View>

          {unreadCount > 0 ? (
            <View style={styles.alertBadge}>
              <Text
                style={
                  styles.alertBadgeText
                }
              >
                {unreadCount > 99
                  ? '99+'
                  : unreadCount}
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.alertCompleteBadge
              }
            >
              <Text
                style={
                  styles.alertCompleteText
                }
              >
                ✓
              </Text>
            </View>
          )}

          <Text style={styles.alertArrow}>
            ›
          </Text>
        </Pressable>

        {/* Privacy */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyShield}>
            <Text
              style={
                styles.privacyShieldText
              }
            >
              ✓
            </Text>
          </View>

          <View style={styles.privacyContent}>
            <Text
              style={styles.privacyTitle}
            >
              Your health is our priority
            </Text>

            <Text
              style={
                styles.privacyDescription
              }
            >
              VitalPilot keeps your health
              information private and
              patient-controlled.
            </Text>
          </View>
        </View>

        {/* Prototype note */}
        <View style={styles.prototypeCard}>
          <Text
            style={styles.prototypeTitle}
          >
            Dashboard prototype
          </Text>

          <Text
            style={styles.prototypeText}
          >
            Health values shown on this screen
            are temporary sample data for
            frontend development. Real
            measurements and notification
            severity will come from the
            VitalPilot backend, Health Analytics
            layer, and database.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniTrend({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const minimum =
    Math.min(...values);

  const maximum =
    Math.max(...values);

  const range =
    Math.max(
      maximum - minimum,
      1
    );

  return (
    <View style={styles.miniTrend}>
      {values.map((value, index) => {
        const normalized =
          (value - minimum) /
          range;

        const height =
          10 + normalized * 25;

        return (
          <View
            key={`${value}-${index}`}
            style={
              styles.miniTrendColumn
            }
          >
            <View
              style={[
                styles.miniTrendBar,
                {
                  height,
                  backgroundColor:
                    color,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

function LegendItem({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
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

function VitalsChart() {
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartLineOne} />
      <View style={styles.chartLineTwo} />
      <View
        style={styles.chartLineThree}
      />
      <View style={styles.chartLineFour} />

      <View style={styles.chartColumns}>
        {overviewData.map((item) => (
          <View
            key={item.day}
            style={styles.chartColumn}
          >
            <View style={styles.dataArea}>
              <View
                style={[
                  styles.dataBar,
                  styles.heartRateBar,
                  {
                    height:
                      item.heartRate,
                  },
                ]}
              />

              <View
                style={[
                  styles.dataBar,
                  styles.bloodPressureBar,
                  {
                    height:
                      item.bloodPressure,
                  },
                ]}
              />

              <View
                style={[
                  styles.dataBar,
                  styles.sleepBar,
                  {
                    height:
                      item.sleep,
                  },
                ]}
              />
            </View>

            <Text
              style={styles.dayLabel}
            >
              {item.day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SummaryRow({
  icon,
  title,
  value,
  color,
  background,
}: {
  icon: string;
  title: string;
  value: string;
  color: string;
  background: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor:
              background,
          },
        ]}
      >
        <Text
          style={[
            styles.summaryIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.summaryTitle}>
        {title}
      </Text>

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text
        style={styles.summaryChevron}
      >
        ›
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F9F7',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom:
      BottomTabInset + 45,
    gap: 18,
  },

  /*
   * Header
   */

  topBar: {
    minHeight: 58,

    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',
  },

  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 38,
    height: 38,

    marginRight: 7,
  },

  logoText: {
    color: '#101828',

    fontSize: 20,
    fontWeight: '900',
  },

  headerActions: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,
  },

  profileButton: {
    width: 44,
    height: 44,

    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatar: {
    width: 39,
    height: 39,

    borderRadius: 20,

    backgroundColor: '#DFF3E9',

    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInitials: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '900',
  },

  /*
   * Greeting
   */

  greetingSection: {
    gap: 5,
  },

  greeting: {
    color: '#101828',

    fontSize: 23,
    fontWeight: '800',
  },

  userName: {
    color:
      VitalPilotColors.primaryDark,
  },

  greetingSubtitle: {
    color: '#667085',

    fontSize: 13,
  },

  /*
   * Notification Summary
   */

  notificationSummary: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#FFF8EB',

    borderWidth: 1,
    borderColor: '#FEDF89',

    borderRadius: 18,

    padding: 13,

    gap: 11,
  },

  notificationSummaryIcon: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: '#F79009',

    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationSummaryIconText: {
    color: '#FFFFFF',

    fontSize: 16,
    fontWeight: '900',
  },

  notificationSummaryContent: {
    flex: 1,
  },

  notificationSummaryLabel: {
    color: '#B54708',

    fontSize: 8,
    fontWeight: '900',

    letterSpacing: 0.7,
  },

  notificationSummaryTitle: {
    color: '#101828',

    fontSize: 12,
    fontWeight: '800',

    marginTop: 3,
  },

  notificationSummaryMessage: {
    color: '#667085',

    fontSize: 9,
    lineHeight: 14,

    marginTop: 3,
  },

  notificationSummaryArrow: {
    color: '#B54708',

    fontSize: 23,
  },

  /*
   * Section Header
   */

  sectionHeader: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'flex-end',
  },

  sectionHeaderCompact: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'flex-start',
  },

  sectionTitle: {
    color: '#101828',

    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: '#667085',

    fontSize: 11,

    marginTop: 3,
  },

  viewAll: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 11,
    fontWeight: '800',
  },

  /*
   * Metric Cards
   */

  metricScroll: {
    gap: 11,
    paddingRight: 8,
  },

  metricCard: {
    width: 182,
    minHeight: 190,

    backgroundColor: '#FFFFFF',

    borderRadius: 19,

    borderWidth: 1,
    borderColor: '#E1E7E4',

    padding: 15,
  },

  metricHeader: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',
  },

  metricIcon: {
    width: 38,
    height: 38,

    borderRadius: 19,

    alignItems: 'center',
    justifyContent: 'center',
  },

  metricIconText: {
    fontSize: 17,
    fontWeight: '900',
  },

  normalBadge: {
    flexDirection: 'row',

    alignItems: 'center',

    borderRadius: 12,

    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  normalDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    marginRight: 5,
  },

  normalText: {
    fontSize: 9,
    fontWeight: '700',
  },

  metricTitle: {
    color: '#475467',

    fontSize: 11,
    fontWeight: '700',

    marginTop: 13,
  },

  metricValueRow: {
    flexDirection: 'row',

    alignItems: 'baseline',

    gap: 4,

    marginTop: 5,
  },

  metricValue: {
    color: '#101828',

    fontSize: 24,
    fontWeight: '900',
  },

  metricUnit: {
    color: '#667085',

    fontSize: 10,
    fontWeight: '600',
  },

  miniTrend: {
    height: 46,

    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'flex-end',

    marginTop: 'auto',
  },

  miniTrendColumn: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  miniTrendBar: {
    width: 3,

    borderRadius: 3,
  },

  /*
   * Dashboard Card
   */

  dashboardCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 21,

    borderWidth: 1,
    borderColor: '#E1E7E4',

    padding: 17,
  },

  cardTitle: {
    color: '#101828',

    fontSize: 17,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: '#667085',

    fontSize: 10,

    marginTop: 3,
  },

  chartHeader: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'flex-start',
  },

  /*
   * Period
   */

  periodSelector: {
    flexDirection: 'row',

    backgroundColor: '#F2F4F3',

    padding: 3,

    borderRadius: 10,
  },

  periodButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,

    borderRadius: 8,
  },

  periodSelected: {
    paddingHorizontal: 9,
    paddingVertical: 7,

    borderRadius: 8,

    backgroundColor: '#FFFFFF',
  },

  periodText: {
    color: '#667085',

    fontSize: 9,
    fontWeight: '600',
  },

  periodTextSelected: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 9,
    fontWeight: '800',
  },

  /*
   * Legend
   */

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 13,

    marginTop: 18,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 8,
    height: 8,

    borderRadius: 4,

    marginRight: 5,
  },

  legendText: {
    color: '#667085',

    fontSize: 9,
  },

  /*
   * Chart
   */

  chartContainer: {
    height: 178,

    position: 'relative',

    marginTop: 11,
  },

  chartLineOne: {
    position: 'absolute',

    top: 20,
    left: 0,
    right: 0,

    height: 1,

    backgroundColor: '#EEF2F0',
  },

  chartLineTwo: {
    position: 'absolute',

    top: 55,
    left: 0,
    right: 0,

    height: 1,

    backgroundColor: '#EEF2F0',
  },

  chartLineThree: {
    position: 'absolute',

    top: 90,
    left: 0,
    right: 0,

    height: 1,

    backgroundColor: '#EEF2F0',
  },

  chartLineFour: {
    position: 'absolute',

    top: 125,
    left: 0,
    right: 0,

    height: 1,

    backgroundColor: '#EEF2F0',
  },

  chartColumns: {
    height: '100%',

    flexDirection: 'row',

    justifyContent:
      'space-between',
  },

  chartColumn: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  dataArea: {
    height: 132,

    flexDirection: 'row',

    alignItems: 'flex-end',

    gap: 3,
  },

  dataBar: {
    width: 4,

    borderRadius: 3,
  },

  heartRateBar: {
    backgroundColor: '#15945C',
  },

  bloodPressureBar: {
    backgroundColor: '#2E7EEA',
  },

  sleepBar: {
    backgroundColor: '#8752D4',
  },

  dayLabel: {
    color: '#98A2B3',

    fontSize: 8,

    marginTop: 6,
  },

  chartAction: {
    alignSelf: 'center',

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 13,

    backgroundColor: '#EFF8F3',

    borderRadius: 11,

    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  chartActionText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 10,
    fontWeight: '800',
  },

  chartActionArrow: {
    color:
      VitalPilotColors.primaryDark,

    marginLeft: 6,
  },

  /*
   * Health Score
   */

  healthScoreSection: {
    alignItems: 'center',

    marginTop: 18,
  },

  scoreOuter: {
    width: 130,
    height: 130,

    borderRadius: 65,

    borderWidth: 9,
    borderColor: '#D8EEE2',

    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreInner: {
    width: 102,
    height: 102,

    borderRadius: 51,

    borderWidth: 7,
    borderColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreValue: {
    color: '#101828',

    fontSize: 30,
    fontWeight: '900',
  },

  scoreTotal: {
    color: '#667085',

    fontSize: 10,
  },

  scoreStatus: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 14,
    fontWeight: '800',

    marginTop: 9,
  },

  scoreDescription: {
    maxWidth: 285,

    color: '#667085',

    textAlign: 'center',

    fontSize: 10,
    lineHeight: 16,

    marginTop: 5,
  },

  summaryRows: {
    marginTop: 18,

    borderRadius: 15,

    overflow: 'hidden',

    borderWidth: 1,
    borderColor: '#EBEFED',
  },

  summaryRow: {
    minHeight: 56,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    paddingHorizontal: 11,

    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },

  summaryIcon: {
    width: 34,
    height: 34,

    borderRadius: 17,

    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryIconText: {
    fontSize: 14,
    fontWeight: '800',
  },

  summaryTitle: {
    flex: 1,

    color: '#344054',

    fontSize: 11,
    fontWeight: '700',

    marginLeft: 9,
  },

  summaryValue: {
    color: '#667085',

    fontSize: 10,
  },

  summaryChevron: {
    color: '#98A2B3',

    fontSize: 19,

    marginLeft: 7,
  },

  fullSummaryButton: {
    minHeight: 43,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 14,

    backgroundColor: '#F2F9F5',

    borderRadius: 11,
  },

  fullSummaryText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 10,
    fontWeight: '800',
  },

  fullSummaryArrow: {
    color:
      VitalPilotColors.primaryDark,

    marginLeft: 7,
  },

  /*
   * Pilot AI
   */

  aiCard: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F0F8F4',

    borderWidth: 1,
    borderColor: '#D8EADF',

    borderRadius: 20,

    padding: 15,

    gap: 12,
  },

  aiIcon: {
    width: 47,
    height: 47,

    borderRadius: 24,

    backgroundColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  aiIconText: {
    color: '#FFFFFF',

    fontSize: 19,
    fontWeight: '900',
  },

  aiContent: {
    flex: 1,
  },

  aiLabel: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 8,
    fontWeight: '900',

    letterSpacing: 0.8,
  },

  aiTitle: {
    color: '#101828',

    fontSize: 13,
    fontWeight: '800',

    marginTop: 3,
  },

  aiDescription: {
    color: '#667085',

    fontSize: 10,
    lineHeight: 15,

    marginTop: 4,
  },

  aiArrow: {
    color: '#98A2B3',

    fontSize: 25,
  },

  /*
   * Doctors
   */

  doctorScroll: {
    gap: 11,

    paddingRight: 8,
  },

  doctorCard: {
    width: 205,

    backgroundColor: '#FFFFFF',

    borderRadius: 19,

    borderWidth: 1,
    borderColor: '#E1E7E4',

    padding: 14,
  },

  doctorPhotoContainer: {
    width: 68,
    height: 68,

    borderRadius: 34,

    overflow: 'hidden',

    alignSelf: 'center',

    backgroundColor: '#EDF5F0',

    marginBottom: 10,
  },

  doctorPhoto: {
    width: '100%',
    height: '100%',
  },

  doctorName: {
    color: '#101828',

    fontSize: 13,
    fontWeight: '800',

    textAlign: 'center',
  },

  doctorSpecialty: {
    color: '#667085',

    fontSize: 10,

    textAlign: 'center',

    marginTop: 3,
  },

  ratingRow: {
    flexDirection: 'row',

    justifyContent: 'center',

    marginTop: 8,
  },

  star: {
    color: '#F79009',

    fontSize: 12,

    marginRight: 4,
  },

  rating: {
    color: '#344054',

    fontSize: 10,
    fontWeight: '700',
  },

  doctorLocation: {
    color: '#667085',

    fontSize: 9,

    textAlign: 'center',

    marginTop: 7,
  },

  doctorButton: {
    minHeight: 37,

    borderWidth: 1,
    borderColor:
      VitalPilotColors.primary,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 12,
  },

  doctorButtonText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 10,
    fontWeight: '800',
  },

  /*
   * Alerts
   */

  alertCard: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 18,

    padding: 14,

    gap: 10,
  },

  alertIcon: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: '#FFF4E5',

    alignItems: 'center',
    justifyContent: 'center',
  },

  alertIconText: {
    color: '#B54708',

    fontWeight: '900',
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    color: '#101828',

    fontSize: 12,
    fontWeight: '800',
  },

  alertDescription: {
    color: '#667085',

    fontSize: 9,
    lineHeight: 14,

    marginTop: 3,
  },

  alertBadge: {
    minWidth: 24,
    height: 24,

    paddingHorizontal: 6,

    borderRadius: 12,

    backgroundColor: '#D92D20',

    alignItems: 'center',
    justifyContent: 'center',
  },

  alertBadgeText: {
    color: '#FFFFFF',

    fontSize: 9,
    fontWeight: '900',
  },

  alertCompleteBadge: {
    width: 24,
    height: 24,

    borderRadius: 12,

    backgroundColor: '#EAF8F0',

    alignItems: 'center',
    justifyContent: 'center',
  },

  alertCompleteText: {
    color: '#137A53',

    fontSize: 11,
    fontWeight: '900',
  },

  alertArrow: {
    color: '#98A2B3',

    fontSize: 22,
  },

  /*
   * Privacy
   */

  privacyCard: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F6FBF8',

    borderWidth: 1,
    borderColor: '#DDEAE3',

    borderRadius: 18,

    padding: 15,

    gap: 12,
  },

  privacyShield: {
    width: 42,
    height: 42,

    borderRadius: 21,

    borderWidth: 2,
    borderColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  privacyShieldText: {
    color:
      VitalPilotColors.primaryDark,

    fontWeight: '900',
  },

  privacyContent: {
    flex: 1,
  },

  privacyTitle: {
    color: '#101828',

    fontSize: 12,
    fontWeight: '800',
  },

  privacyDescription: {
    color: '#667085',

    fontSize: 9,
    lineHeight: 15,

    marginTop: 3,
  },

  /*
   * Prototype
   */

  prototypeCard: {
    backgroundColor: '#F8FAF9',

    borderRadius: 14,

    padding: 13,
  },

  prototypeTitle: {
    color: '#475467',

    fontSize: 10,
    fontWeight: '800',
  },

  prototypeText: {
    color: '#667085',

    fontSize: 9,
    lineHeight: 15,

    marginTop: 4,
  },

  pressed: {
    opacity: 0.65,
  },
});