import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';

type AppRoute =
  | '/metrics'
  | '/chatbot'
  | '/reports'
  | '/doctors'
  | '/profile';

type FeatureCategory =
  | 'Monitoring'
  | 'Insights'
  | 'Care'
  | 'Account';

type FeatureItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: FeatureCategory;
  route: AppRoute;
  keywords: string[];
};

type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: AppRoute;
};

const quickActions: QuickAction[] = [
  {
    id: 'log',
    title: 'Log Health Data',
    subtitle: 'Record a new measurement',
    icon: '+',
    route: '/metrics',
  },
  {
    id: 'ai',
    title: 'Ask Pilot AI',
    subtitle: 'Discuss symptoms or trends',
    icon: '✦',
    route: '/chatbot',
  },
  {
    id: 'report',
    title: 'Health Reports',
    subtitle: 'Review your health trends',
    icon: '▤',
    route: '/reports',
  },
  {
    id: 'doctor',
    title: 'Find a Doctor',
    subtitle: 'Search healthcare providers',
    icon: '✚',
    route: '/doctors',
  },
];

const features: FeatureItem[] = [
  {
    id: 'health-metrics',
    title: 'Health Metrics',
    description:
      'Record and review your selected health measurements.',
    icon: '♥',
    category: 'Monitoring',
    route: '/metrics',
    keywords: [
      'health',
      'metrics',
      'vitals',
      'blood pressure',
      'glucose',
      'oxygen',
      'weight',
      'sleep',
      'water',
      'activity',
    ],
  },
  {
    id: 'blood-pressure',
    title: 'Blood Pressure',
    description:
      'Log systolic and diastolic blood pressure readings.',
    icon: '⌁',
    category: 'Monitoring',
    route: '/metrics',
    keywords: [
      'blood pressure',
      'systolic',
      'diastolic',
      'mmhg',
      'hypertension',
    ],
  },
  {
    id: 'blood-glucose',
    title: 'Blood Glucose',
    description:
      'Record glucose measurements and review recent values.',
    icon: '◈',
    category: 'Monitoring',
    route: '/metrics',
    keywords: [
      'blood glucose',
      'glucose',
      'sugar',
      'diabetes',
      'mg/dl',
    ],
  },
  {
    id: 'blood-oxygen',
    title: 'Blood Oxygen',
    description:
      'Track blood oxygen measurements over time.',
    icon: '◉',
    category: 'Monitoring',
    route: '/metrics',
    keywords: [
      'oxygen',
      'blood oxygen',
      'spo2',
      'percentage',
    ],
  },
  {
    id: 'weight',
    title: 'Weight',
    description:
      'Record weight using metric or U.S. measurement units.',
    icon: '▣',
    category: 'Monitoring',
    route: '/metrics',
    keywords: [
      'weight',
      'kg',
      'lb',
      'pounds',
      'kilograms',
    ],
  },
  {
    id: 'pilot-ai',
    title: 'Pilot AI',
    description:
      'Ask health-related questions and get informational guidance.',
    icon: '✦',
    category: 'Insights',
    route: '/chatbot',
    keywords: [
      'ai',
      'pilot',
      'symptoms',
      'assistant',
      'question',
      'chat',
    ],
  },
  {
    id: 'reports',
    title: 'Health Reports',
    description:
      'Review summaries, health trends, and previously generated reports.',
    icon: '▤',
    category: 'Insights',
    route: '/reports',
    keywords: [
      'report',
      'reports',
      'summary',
      'trend',
      'weekly',
      'monthly',
      'health report',
    ],
  },
  {
    id: 'doctor-referral',
    title: 'Doctor Referral',
    description:
      'Search for healthcare providers by specialty and location.',
    icon: '✚',
    category: 'Care',
    route: '/doctors',
    keywords: [
      'doctor',
      'provider',
      'specialist',
      'cardiology',
      'endocrinology',
      'referral',
    ],
  },
  {
    id: 'provider-sharing',
    title: 'Provider Sharing',
    description:
      'Review and manage patient-controlled health information sharing.',
    icon: '✓',
    category: 'Care',
    route: '/doctors',
    keywords: [
      'provider',
      'sharing',
      'privacy',
      'health data',
      'access',
      'consent',
    ],
  },
  {
    id: 'profile',
    title: 'Patient Profile',
    description:
      'Manage your personal information and health preferences.',
    icon: '○',
    category: 'Account',
    route: '/profile',
    keywords: [
      'profile',
      'patient',
      'account',
      'personal',
      'information',
    ],
  },
  {
    id: 'notifications',
    title: 'Notification Preferences',
    description:
      'Manage critical alerts, reminders, summaries, and milestones.',
    icon: '!',
    category: 'Account',
    route: '/profile',
    keywords: [
      'notification',
      'alerts',
      'reminders',
      'weekly summary',
      'milestone',
    ],
  },
  {
    id: 'units',
    title: 'Measurement Units',
    description:
      'Choose metric or U.S. units for supported measurements.',
    icon: '↔',
    category: 'Account',
    route: '/profile',
    keywords: [
      'units',
      'metric',
      'us',
      'kg',
      'lb',
      'ml',
      'oz',
    ],
  },
];

const categoryOrder: FeatureCategory[] = [
  'Monitoring',
  'Insights',
  'Care',
  'Account',
];

export default function ExploreScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');

  const filteredFeatures = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return features;
    }

    return features.filter((feature) => {
      const searchableText = [
        feature.title,
        feature.description,
        feature.category,
        ...feature.keywords,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalized);
    });
  }, [query]);

  const groupedFeatures = useMemo(() => {
    return categoryOrder
      .map((category) => ({
        category,
        items: filteredFeatures.filter(
          (feature) => feature.category === category
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredFeatures]);

  function navigate(route: AppRoute) {
    router.push(route);
  }

  function clearSearch() {
    setQuery('');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Explore VitalPilot
          </Text>

          <Text style={styles.subtitle}>
            Find health tools, reports, provider
            resources, and account settings.
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
            placeholder="Search metrics, reports, doctors, AI..."
            placeholderTextColor="#98A2B3"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search VitalPilot"
          />

          {query.length > 0 && (
            <Pressable
              onPress={clearSearch}
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearText}>
                ×
              </Text>
            </Pressable>
          )}
        </View>

        {/* Only show discovery content when not searching */}
        {!query.trim() && (
          <>
            {/* Quick Actions */}
            <SectionHeader
              title="Quick Actions"
              subtitle="Start with the tasks you use most often."
            />

            <View style={styles.quickActionGrid}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.id}
                  onPress={() =>
                    navigate(action.route)
                  }
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                >
                  <View style={styles.quickActionIcon}>
                    <Text
                      style={
                        styles.quickActionIconText
                      }
                    >
                      {action.icon}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.quickActionTitle
                    }
                  >
                    {action.title}
                  </Text>

                  <Text
                    style={
                      styles.quickActionSubtitle
                    }
                  >
                    {action.subtitle}
                  </Text>

                  <Text
                    style={
                      styles.quickActionArrow
                    }
                  >
                    →
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* For You */}
            <SectionHeader
              title="For You"
              subtitle="Suggested actions based on your VitalPilot experience."
            />

            <RecommendationCard
              label="WEEKLY HEALTH SUMMARY"
              title="Review your latest health trends"
              description="Your health report can help you review changes in recent measurements."
              icon="▤"
              variant="green"
              buttonLabel="Open Health Reports"
              onPress={() =>
                navigate('/reports')
              }
            />

            <RecommendationCard
              label="PILOT AI"
              title="Have questions about your health information?"
              description="Ask Pilot AI to explain vitals, reports, or help organize questions for a healthcare professional."
              icon="✦"
              variant="purple"
              buttonLabel="Ask Pilot AI"
              onPress={() =>
                navigate('/chatbot')
              }
            />
          </>
        )}

        {/* Browse / Search Results */}
        <SectionHeader
          title={
            query.trim()
              ? 'Search Results'
              : 'Browse by Category'
          }
          subtitle={
            query.trim()
              ? `${filteredFeatures.length} ${
                  filteredFeatures.length === 1
                    ? 'result'
                    : 'results'
                } found`
              : 'Explore VitalPilot features organized by purpose.'
          }
        />

        {filteredFeatures.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text
                style={
                  styles.emptyIconText
                }
              >
                🔍
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              Nothing found
            </Text>

            <Text style={styles.emptyText}>
              Try searching for another health
              metric, report, provider, or
              account feature.
            </Text>

            <Pressable
              onPress={clearSearch}
              style={({ pressed }) => [
                styles.clearSearchButton,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.clearSearchText
                }
              >
                Clear Search
              </Text>
            </Pressable>
          </View>
        ) : (
          groupedFeatures.map((group) => (
            <View
              key={group.category}
              style={styles.categorySection}
            >
              <View style={styles.categoryHeader}>
                <Text
                  style={styles.categoryTitle}
                >
                  {group.category}
                </Text>

                <View
                  style={styles.categoryCount}
                >
                  <Text
                    style={
                      styles.categoryCountText
                    }
                  >
                    {group.items.length}
                  </Text>
                </View>
              </View>

              <View style={styles.featureGrid}>
                {group.items.map((feature) => (
                  <Pressable
                    key={feature.id}
                    onPress={() =>
                      navigate(feature.route)
                    }
                    style={({ pressed }) => [
                      styles.featureCard,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      feature.title
                    }
                  >
                    <View
                      style={styles.featureIcon}
                    >
                      <Text
                        style={
                          styles.featureIconText
                        }
                      >
                        {feature.icon}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.featureTitle
                      }
                    >
                      {feature.title}
                    </Text>

                    <Text
                      style={
                        styles.featureDescription
                      }
                    >
                      {feature.description}
                    </Text>

                    <View
                      style={
                        styles.featureOpenRow
                      }
                    >
                      <Text
                        style={
                          styles.featureOpenText
                        }
                      >
                        Open
                      </Text>

                      <Text
                        style={
                          styles.featureArrow
                        }
                      >
                        →
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Privacy */}
        {!query.trim() && (
          <View style={styles.privacyCard}>
            <View style={styles.privacyIcon}>
              <Text
                style={
                  styles.privacyIconText
                }
              >
                ✓
              </Text>
            </View>

            <View style={styles.privacyContent}>
              <Text
                style={styles.privacyTitle}
              >
                Patient-controlled health
                information
              </Text>

              <Text
                style={styles.privacyText}
              >
                VitalPilot should only share
                patient health information with
                healthcare providers after the
                patient explicitly authorizes
                access.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <Text style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function RecommendationCard({
  label,
  title,
  description,
  icon,
  variant,
  buttonLabel,
  onPress,
}: {
  label: string;
  title: string;
  description: string;
  icon: string;
  variant: 'green' | 'purple';
  buttonLabel: string;
  onPress: () => void;
}) {
  const isPurple =
    variant === 'purple';

  return (
    <View
      style={
        isPurple
          ? styles.recommendationCardSecondary
          : styles.recommendationCard
      }
    >
      <View
        style={
          isPurple
            ? styles.recommendationIconAI
            : styles.recommendationIcon
        }
      >
        <Text
          style={
            isPurple
              ? styles.recommendationIconAIText
              : styles.recommendationIconText
          }
        >
          {icon}
        </Text>
      </View>

      <View style={styles.recommendationContent}>
        <Text
          style={styles.recommendationLabel}
        >
          {label}
        </Text>

        <Text
          style={styles.recommendationTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.recommendationText}
        >
          {description}
        </Text>

        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.recommendationButton,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={
              styles.recommendationButtonText
            }
          >
            {buttonLabel}
          </Text>

          <Text
            style={
              styles.recommendationArrow
            }
          >
            →
          </Text>
        </Pressable>
      </View>
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
    paddingBottom: BottomTabInset + 40,
    gap: 18,
  },

  header: {
    gap: 4,
  },

  title: {
    color: VitalPilotColors.title,
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },

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
    fontSize: 16,
    marginRight: 8,
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

  sectionTitle: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  quickActionCard: {
    width: '48%',
    minHeight: 142,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7E3',
    borderRadius: 18,
    padding: 14,
  },

  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  quickActionIconText: {
    color: VitalPilotColors.primaryDark,
    fontSize: 18,
    fontWeight: '900',
  },

  quickActionTitle: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '800',
  },

  quickActionSubtitle: {
    color: '#667085',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    marginRight: 6,
  },

  quickActionArrow: {
    color: VitalPilotColors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 'auto',
    alignSelf: 'flex-end',
  },

  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#F1FAF5',
    borderWidth: 1,
    borderColor: '#D9EEE3',
    borderRadius: 20,
    padding: 16,
    gap: 13,
  },

  recommendationCardSecondary: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#E7E1FF',
    borderRadius: 20,
    padding: 16,
    gap: 13,
  },

  recommendationIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  recommendationIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  recommendationIconAI: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#7257C6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  recommendationIconAIText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  recommendationContent: {
    flex: 1,
  },

  recommendationLabel: {
    color: '#667085',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  recommendationTitle: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },

  recommendationText: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  recommendationButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 11,
  },

  recommendationButtonText: {
    color: VitalPilotColors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },

  recommendationArrow: {
    color: VitalPilotColors.primaryDark,
    fontSize: 12,
    marginLeft: 5,
  },

  categorySection: {
    gap: 11,
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  categoryTitle: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '800',
  },

  categoryCount: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: '#EEF2F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryCountText: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  featureCard: {
    width: '48%',
    minHeight: 158,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E5',
    borderRadius: 18,
    padding: 14,
  },

  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F1F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  featureIconText: {
    color: VitalPilotColors.primaryDark,
    fontSize: 17,
    fontWeight: '900',
  },

  featureTitle: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
  },

  featureDescription: {
    color: '#667085',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  featureOpenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 10,
  },

  featureOpenText: {
    color: VitalPilotColors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },

  featureArrow: {
    color: VitalPilotColors.primaryDark,
    fontSize: 12,
    marginLeft: 5,
  },

  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E5',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F7F5',
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
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: '#ECF8F2',
  },

  clearSearchText: {
    color: VitalPilotColors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },

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
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  privacyIconText: {
    color: VitalPilotColors.primaryDark,
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
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  pressed: {
    opacity: 0.65,
  },
});