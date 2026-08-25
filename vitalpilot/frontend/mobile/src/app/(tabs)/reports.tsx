import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

type Period = '7 Days' | '30 Days' | '90 Days';

type MetricStatus =
  | 'In Range'
  | 'Stable'
  | 'Attention';

type InsightType =
  | 'positive'
  | 'warning'
  | 'info';

type ReportHistoryItem = {
  id: string;
  title: string;
  dateRange: string;
  metrics: string;
};

const periods: Period[] = [
  '7 Days',
  '30 Days',
  '90 Days',
];

const reportHistory: ReportHistoryItem[] = [
  {
    id: '1',
    title: 'Weekly Health Summary',
    dateRange: 'Aug 17 – Aug 23',
    metrics: '4 metrics • 7 days',
  },
  {
    id: '2',
    title: 'Monthly Health Report',
    dateRange: 'July 2026',
    metrics: '4 metrics • 30 days',
  },
];

export default function ReportsScreen() {
  const router = useRouter();

  const [period, setPeriod] =
    useState<Period>('30 Days');

  const [message, setMessage] =
    useState('');

  const [isGenerating, setIsGenerating] =
    useState(false);

  const periodLabel = useMemo(() => {
    switch (period) {
      case '7 Days':
        return 'Last 7 days';

      case '30 Days':
        return 'Last 30 days';

      case '90 Days':
        return 'Last 90 days';
    }
  }, [period]);

  async function generateReport() {
    setMessage('');
    setIsGenerating(true);

    try {
      /*
       * FRONTEND PROTOTYPE
       *
       * Replace this delay with the
       * Notification & Reporting API
       * when the backend is ready.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 600)
      );

      setMessage(
        `${period} health report generated successfully.`
      );
    } catch {
      setMessage(
        'Unable to generate the health report.'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function shareReport() {
    /*
     * The final implementation should
     * display authorized providers and
     * allow the patient to select exactly
     * what information is shared.
     */

    setMessage(
      'Provider sharing will be connected when provider and reporting services are available.'
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation */}
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
        </View>

        {/* Page heading */}
        <View style={styles.pageHeader}>
          <Text style={styles.title}>
            Health Reports
          </Text>

          <Text style={styles.subtitle}>
            Understand your health trends,
            progress, and recent measurements.
          </Text>
        </View>

        {/* Period selector */}
        <View style={styles.periodSelector}>
          {periods.map((item) => {
            const selected =
              period === item;

            return (
              <Pressable
                key={item}
                onPress={() =>
                  setPeriod(item)
                }
                style={
                  selected
                    ? styles.periodSelected
                    : styles.periodButton
                }
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                }}
              >
                <Text
                  style={
                    selected
                      ? styles.periodTextSelected
                      : styles.periodText
                  }
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Overall summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text
                style={styles.sectionEyebrow}
              >
                HEALTH SUMMARY
              </Text>

              <Text
                style={styles.sectionTitle}
              >
                {periodLabel}
              </Text>
            </View>

            <View style={styles.scoreCircle}>
              <Text style={styles.score}>
                85
              </Text>

              <Text style={styles.scoreMax}>
                /100
              </Text>
            </View>
          </View>

          <View style={styles.overallStatus}>
            <View style={styles.statusDot} />

            <View>
              <Text
                style={styles.overallTitle}
              >
                Overall Status
              </Text>

              <Text
                style={styles.overallValue}
              >
                Stable
              </Text>
            </View>
          </View>

          <View style={styles.summaryStats}>
            <SummaryStat
              value="3"
              label="In range"
            />

            <View
              style={
                styles.statDivider
              }
            />

            <SummaryStat
              value="1"
              label="Needs attention"
            />

            <View
              style={
                styles.statDivider
              }
            />

            <SummaryStat
              value="12"
              label="Days logged"
            />
          </View>
        </View>

        {/* Key insights */}
        <View>
          <Text style={styles.sectionTitle}>
            Key Insights
          </Text>

          <Text style={styles.sectionSubtitle}>
            Highlights from your recent
            measurements.
          </Text>
        </View>

        <View style={styles.insightsCard}>
          <InsightRow
            type="positive"
            title="Blood pressure improved"
            description="Your average systolic blood pressure decreased compared with the previous period."
          />

          <View style={styles.divider} />

          <InsightRow
            type="warning"
            title="Blood glucose trend"
            description="Several recent glucose readings were above your selected target range."
          />

          <View style={styles.divider} />

          <InsightRow
            type="positive"
            title="Weight remained stable"
            description="Your recent weight measurements show minimal change."
          />
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

          <View style={styles.aiTextContainer}>
            <Text style={styles.aiTitle}>
              Ask Pilot AI
            </Text>

            <Text style={styles.aiDescription}>
              Get an informational explanation
              of your recent health trends.
            </Text>
          </View>

          <Text style={styles.chevron}>
            ›
          </Text>
        </Pressable>

        {/* Metrics */}
        <View>
          <Text style={styles.sectionTitle}>
            Your Health Metrics
          </Text>

          <Text style={styles.sectionSubtitle}>
            Review individual measurements and
            trends.
          </Text>
        </View>

        <MetricReportCard
          title="Blood Pressure"
          value="124/79"
          unit="mmHg"
          subtitle={`${period} average`}
          status="Stable"
          statusType="stable"
          trendText="↓ 6 mmHg compared with previous period"
          trendValues={[
            68,
            72,
            62,
            77,
            71,
            66,
            70,
          ]}
          lineColor="#15945C"
          onViewDetails={() =>
            router.push('/metrics')
          }
        />

        <MetricReportCard
          title="Blood Glucose"
          value="132"
          unit="mg/dL"
          subtitle="Latest reading"
          status="Attention"
          statusType="attention"
          trendText="Several readings were above your selected target range."
          trendValues={[
            55,
            63,
            72,
            59,
            84,
            68,
            77,
          ]}
          lineColor="#EAAA08"
          onViewDetails={() =>
            router.push('/metrics')
          }
        />

        <MetricReportCard
          title="Blood Oxygen"
          value="98"
          unit="%"
          subtitle={`${period} average`}
          status="In Range"
          statusType="normal"
          trendText="Measurements remained relatively consistent."
          trendValues={[
            77,
            80,
            74,
            82,
            79,
            81,
            80,
          ]}
          lineColor="#2E7EEA"
          onViewDetails={() =>
            router.push('/metrics')
          }
        />

        <MetricReportCard
          title="Weight"
          value="68.0"
          unit="kg"
          subtitle="Latest measurement"
          status="Stable"
          statusType="stable"
          trendText="Weight remained relatively stable during this period."
          trendValues={[
            71,
            70,
            69,
            69,
            68,
            69,
            68,
          ]}
          lineColor="#8752D4"
          onViewDetails={() =>
            router.push('/metrics')
          }
        />

        {/* Privacy */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}>
            <Text
              style={styles.privacyIconText}
            >
              ✓
            </Text>
          </View>

          <View style={styles.privacyContent}>
            <Text
              style={styles.privacyTitle}
            >
              Your reports are private
            </Text>

            <Text
              style={styles.privacyText}
            >
              A healthcare provider should
              receive your health report only
              after you explicitly authorize
              sharing.
            </Text>
          </View>
        </View>

        {/* Report actions */}
        <View style={styles.reportActions}>
          <Pressable
            onPress={generateReport}
            disabled={isGenerating}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed &&
                !isGenerating &&
                styles.pressed,
              isGenerating &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isGenerating
                ? 'Generating Report...'
                : 'Generate Health Report'}
            </Text>
          </Pressable>

          <Pressable
            onPress={shareReport}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Share with Healthcare Provider
            </Text>
          </Pressable>
        </View>

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {message}
            </Text>
          </View>
        ) : null}

        {/* Report history */}
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Report History
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Previously generated health
              summaries.
            </Text>
          </View>
        </View>

        <View style={styles.historyList}>
          {reportHistory.map(
            (report, index) => (
              <View
                key={report.id}
                style={[
                  styles.historyItem,
                  index <
                    reportHistory.length -
                      1 &&
                    styles.historyItemBorder,
                ]}
              >
                <View
                  style={
                    styles.historyIcon
                  }
                >
                  <Text
                    style={
                      styles.historyIconText
                    }
                  >
                    ▤
                  </Text>
                </View>

                <View
                  style={
                    styles.historyInfo
                  }
                >
                  <Text
                    style={
                      styles.historyTitle
                    }
                  >
                    {report.title}
                  </Text>

                  <Text
                    style={
                      styles.historyDate
                    }
                  >
                    {report.dateRange}
                  </Text>

                  <Text
                    style={
                      styles.historyMetrics
                    }
                  >
                    {report.metrics}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setMessage(
                      `${report.title} selected.`
                    )
                  }
                  style={
                    styles.viewReportButton
                  }
                >
                  <Text
                    style={
                      styles.viewReportText
                    }
                  >
                    View
                  </Text>
                </Pressable>
              </View>
            )
          )}
        </View>

        {/* Informational disclaimer */}
        <View style={styles.disclaimer}>
          <Text
            style={styles.disclaimerTitle}
          >
            About your health report
          </Text>

          <Text
            style={styles.disclaimerText}
          >
            VitalPilot reports summarize
            recorded health information and
            trends. They are informational and
            are not a medical diagnosis.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.summaryStat}>
      <Text
        style={styles.summaryStatValue}
      >
        {value}
      </Text>

      <Text
        style={styles.summaryStatLabel}
      >
        {label}
      </Text>
    </View>
  );
}

function InsightRow({
  type,
  title,
  description,
}: {
  type: InsightType;
  title: string;
  description: string;
}) {
  const config = {
    positive: {
      icon: '✓',
      backgroundColor: '#EAF8F0',
      color: '#137A53',
    },

    warning: {
      icon: '!',
      backgroundColor: '#FFF4E5',
      color: '#B54708',
    },

    info: {
      icon: 'i',
      backgroundColor: '#EEF4FF',
      color: '#175CD3',
    },
  }[type];

  return (
    <View style={styles.insightRow}>
      <View
        style={[
          styles.insightIcon,
          {
            backgroundColor:
              config.backgroundColor,
          },
        ]}
      >
        <Text
          style={[
            styles.insightIconText,
            {
              color: config.color,
            },
          ]}
        >
          {config.icon}
        </Text>
      </View>

      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>
          {title}
        </Text>

        <Text
          style={styles.insightDescription}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function MetricReportCard({
  title,
  value,
  unit,
  subtitle,
  status,
  statusType,
  trendText,
  trendValues,
  lineColor,
  onViewDetails,
}: {
  title: string;
  value: string;
  unit: string;
  subtitle: string;
  status: MetricStatus;
  statusType:
    | 'normal'
    | 'stable'
    | 'attention';
  trendText: string;
  trendValues: number[];
  lineColor: string;
  onViewDetails: () => void;
}) {
  const statusStyle =
    getStatusStyle(statusType);

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>
          {title}
        </Text>

        <View
          style={[
            styles.metricStatus,
            {
              backgroundColor:
                statusStyle.background,
            },
          ]}
        >
          <View
            style={[
              styles.metricStatusDot,
              {
                backgroundColor:
                  statusStyle.color,
              },
            ]}
          />

          <Text
            style={[
              styles.metricStatusText,
              {
                color:
                  statusStyle.color,
              },
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>
          {value}
        </Text>

        <Text style={styles.metricUnit}>
          {unit}
        </Text>
      </View>

      <Text style={styles.metricSubtitle}>
        {subtitle}
      </Text>

      <SimpleTrendChart
        values={trendValues}
        color={lineColor}
      />

      <Text style={styles.trendText}>
        {trendText}
      </Text>

      <Pressable
        onPress={onViewDetails}
        style={({ pressed }) => [
          styles.detailsButton,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={styles.detailsButtonText}
        >
          View Details
        </Text>

        <Text style={styles.detailsArrow}>
          →
        </Text>
      </Pressable>
    </View>
  );
}

function SimpleTrendChart({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const maximum =
    Math.max(...values);

  const minimum =
    Math.min(...values);

  const range =
    Math.max(maximum - minimum, 1);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartGridLine1} />
      <View style={styles.chartGridLine2} />
      <View style={styles.chartGridLine3} />

      <View style={styles.chartBars}>
        {values.map((value, index) => {
          const normalized =
            (value - minimum) / range;

          const height =
            24 + normalized * 58;

          return (
            <View
              key={`${value}-${index}`}
              style={
                styles.chartPointColumn
              }
            >
              <View
                style={[
                  styles.chartStem,
                  {
                    height,
                    backgroundColor:
                      color,
                  },
                ]}
              />

              <View
                style={[
                  styles.chartDot,
                  {
                    backgroundColor:
                      color,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.chartLabels}>
        <Text style={styles.chartLabel}>
          Start
        </Text>

        <Text style={styles.chartLabel}>
          Mid
        </Text>

        <Text style={styles.chartLabel}>
          Now
        </Text>
      </View>
    </View>
  );
}

function getStatusStyle(
  status:
    | 'normal'
    | 'stable'
    | 'attention'
) {
  switch (status) {
    case 'normal':
      return {
        color: '#137A53',
        background: '#EAF8F0',
      };

    case 'stable':
      return {
        color: '#175CD3',
        background: '#EEF4FF',
      };

    case 'attention':
      return {
        color: '#B54708',
        background: '#FFF4E5',
      };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom:
      BottomTabInset + 40,
    gap: 16,
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
    color:
      VitalPilotColors.primaryDark,

    fontSize: 31,
    lineHeight: 31,

    marginRight: 3,
  },

  backText: {
    color:
      VitalPilotColors.primaryDark,

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
    opacity: 0.65,
  },

  /*
   * Page title
   */

  pageHeader: {
    gap: 5,
  },

  title: {
    color:
      VitalPilotColors.title,

    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#667085',

    fontSize: 14,
    lineHeight: 21,
  },

  /*
   * Period
   */

  periodSelector: {
    flexDirection: 'row',

    padding: 4,

    borderRadius: 14,

    backgroundColor: '#EAEEEC',

    gap: 4,
  },

  periodButton: {
    flex: 1,

    minHeight: 42,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',
  },

  periodSelected: {
    flex: 1,

    minHeight: 42,

    borderRadius: 11,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  periodText: {
    color: '#667085',

    fontSize: 12,
    fontWeight: '600',
  },

  periodTextSelected: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '800',
  },

  /*
   * Summary
   */

  summaryCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 20,

    padding: 18,

    gap: 16,
  },

  summaryHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionEyebrow: {
    color: '#98A2B3',

    fontSize: 10,
    fontWeight: '800',

    letterSpacing: 1,
  },

  sectionTitle: {
    color: '#101828',

    fontSize: 18,
    fontWeight: '800',

    marginTop: 2,
  },

  sectionSubtitle: {
    color: '#667085',

    fontSize: 12,
    lineHeight: 18,

    marginTop: 3,
  },

  scoreCircle: {
    width: 82,
    height: 82,

    borderRadius: 41,

    borderWidth: 6,
    borderColor: '#15945C',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F9FCFA',
  },

  score: {
    color: '#101828',

    fontSize: 24,
    fontWeight: '900',
  },

  scoreMax: {
    color: '#667085',

    fontSize: 10,
  },

  overallStatus: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#F5FAF7',

    borderRadius: 14,

    padding: 12,
  },

  statusDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: '#15945C',

    marginRight: 10,
  },

  overallTitle: {
    color: '#667085',

    fontSize: 10,
  },

  overallValue: {
    color: '#137A53',

    fontSize: 14,
    fontWeight: '800',

    marginTop: 2,
  },

  summaryStats: {
    minHeight: 72,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryStat: {
    flex: 1,

    alignItems: 'center',
  },

  summaryStatValue: {
    color: '#101828',

    fontSize: 21,
    fontWeight: '900',
  },

  summaryStatLabel: {
    color: '#667085',

    textAlign: 'center',

    fontSize: 10,

    marginTop: 3,
  },

  statDivider: {
    width: 1,
    height: 36,

    backgroundColor: '#E4E7EC',
  },

  /*
   * Insights
   */

  insightsCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 18,

    paddingHorizontal: 15,
  },

  insightRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    paddingVertical: 14,

    gap: 11,
  },

  insightIcon: {
    width: 34,
    height: 34,

    borderRadius: 17,

    alignItems: 'center',
    justifyContent: 'center',
  },

  insightIconText: {
    fontSize: 14,
    fontWeight: '900',
  },

  insightContent: {
    flex: 1,
  },

  insightTitle: {
    color: '#101828',

    fontSize: 13,
    fontWeight: '800',
  },

  insightDescription: {
    color: '#667085',

    fontSize: 11,
    lineHeight: 17,

    marginTop: 3,
  },

  divider: {
    height: 1,

    backgroundColor: '#EEF2F0',
  },

  /*
   * AI
   */

  aiCard: {
    minHeight: 88,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#EFF8F3',

    borderWidth: 1,
    borderColor: '#D3EADF',

    borderRadius: 18,

    padding: 15,

    gap: 12,
  },

  aiIcon: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  aiIconText: {
    color: '#FFFFFF',

    fontSize: 18,
    fontWeight: '900',
  },

  aiTextContainer: {
    flex: 1,
  },

  aiTitle: {
    color: '#101828',

    fontSize: 14,
    fontWeight: '800',
  },

  aiDescription: {
    color: '#52635B',

    fontSize: 11,
    lineHeight: 17,

    marginTop: 3,
  },

  chevron: {
    color: '#98A2B3',

    fontSize: 24,
  },

  /*
   * Metric cards
   */

  metricCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 20,

    padding: 17,

    gap: 10,
  },

  metricHeader: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    gap: 10,
  },

  metricTitle: {
    flex: 1,

    color: '#101828',

    fontSize: 16,
    fontWeight: '800',
  },

  metricStatus: {
    flexDirection: 'row',

    alignItems: 'center',

    borderRadius: 14,

    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  metricStatusDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    marginRight: 5,
  },

  metricStatusText: {
    fontSize: 10,
    fontWeight: '800',
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
    color: '#667085',

    fontSize: 11,
    fontWeight: '600',
  },

  metricSubtitle: {
    color: '#98A2B3',

    fontSize: 10,
  },

  trendText: {
    color: '#667085',

    fontSize: 11,
    lineHeight: 17,
  },

  detailsButton: {
    minHeight: 42,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F3FAF6',

    borderRadius: 11,

    gap: 6,

    marginTop: 2,
  },

  detailsButtonText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '800',
  },

  detailsArrow: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 15,
  },

  /*
   * Chart
   */

  chartContainer: {
    height: 140,

    position: 'relative',

    justifyContent: 'flex-end',

    paddingTop: 12,
  },

  chartGridLine1: {
    position: 'absolute',

    left: 0,
    right: 0,
    top: 22,

    height: 1,

    backgroundColor: '#EEF2F0',
  },

  chartGridLine2: {
    position: 'absolute',

    left: 0,
    right: 0,
    top: 58,

    height: 1,

    backgroundColor: '#EEF2F0',
  },

  chartGridLine3: {
    position: 'absolute',

    left: 0,
    right: 0,
    top: 94,

    height: 1,

    backgroundColor: '#EEF2F0',
  },

  chartBars: {
    height: 103,

    flexDirection: 'row',

    alignItems: 'flex-end',
    justifyContent: 'space-between',

    paddingHorizontal: 5,
  },

  chartPointColumn: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  chartStem: {
    width: 2,

    borderRadius: 1,

    opacity: 0.35,
  },

  chartDot: {
    width: 7,
    height: 7,

    borderRadius: 4,
  },

  chartLabels: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    marginTop: 6,
  },

  chartLabel: {
    color: '#98A2B3',

    fontSize: 9,
  },

  /*
   * Privacy
   */

  privacyCard: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    backgroundColor: '#F6FBF8',

    borderWidth: 1,
    borderColor: '#DFEAE4',

    borderRadius: 17,

    padding: 14,

    gap: 11,
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

  privacyContent: {
    flex: 1,
  },

  privacyTitle: {
    color: '#101828',

    fontSize: 12,
    fontWeight: '800',
  },

  privacyText: {
    color: '#667085',

    fontSize: 11,
    lineHeight: 17,

    marginTop: 3,
  },

  /*
   * Actions
   */

  reportActions: {
    gap: 10,
  },

  primaryButton: {
    minHeight: 50,

    borderRadius: 14,

    backgroundColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 16,
  },

  primaryButtonText: {
    color: '#FFFFFF',

    fontSize: 13,
    fontWeight: '800',
  },

  secondaryButton: {
    minHeight: 50,

    borderRadius: 14,

    borderWidth: 1,
    borderColor:
      VitalPilotColors.primary,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 16,
  },

  secondaryButtonText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 13,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.55,
  },

  messageBox: {
    backgroundColor: '#EEF8F2',

    borderRadius: 13,

    padding: 12,
  },

  messageText: {
    color: '#137A53',

    fontSize: 11,
    lineHeight: 17,
  },

  /*
   * Report History
   */

  historyHeader: {
    marginTop: 3,
  },

  historyList: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 18,

    overflow: 'hidden',
  },

  historyItem: {
    minHeight: 86,

    flexDirection: 'row',
    alignItems: 'center',

    padding: 14,

    gap: 11,
  },

  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },

  historyIcon: {
    width: 42,
    height: 42,

    borderRadius: 12,

    backgroundColor: '#ECF8F2',

    alignItems: 'center',
    justifyContent: 'center',
  },

  historyIconText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 18,
    fontWeight: '800',
  },

  historyInfo: {
    flex: 1,
  },

  historyTitle: {
    color: '#101828',

    fontSize: 12,
    fontWeight: '800',
  },

  historyDate: {
    color: '#667085',

    fontSize: 10,

    marginTop: 3,
  },

  historyMetrics: {
    color: '#98A2B3',

    fontSize: 9,

    marginTop: 2,
  },

  viewReportButton: {
    minWidth: 52,

    paddingHorizontal: 10,
    paddingVertical: 8,

    borderRadius: 10,

    backgroundColor: '#F3FAF6',

    alignItems: 'center',
  },

  viewReportText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 11,
    fontWeight: '800',
  },

  /*
   * Disclaimer
   */

  disclaimer: {
    backgroundColor: '#F8FAF9',

    borderRadius: 14,

    padding: 14,
  },

  disclaimerTitle: {
    color: '#475467',

    fontSize: 11,
    fontWeight: '800',
  },

  disclaimerText: {
    color: '#667085',

    fontSize: 10,
    lineHeight: 16,

    marginTop: 4,
  },
});