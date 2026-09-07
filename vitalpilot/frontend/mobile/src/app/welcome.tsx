import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalPilotColors } from '@/constants/vitalpilot';

const { width: SCREEN_WIDTH } =
  Dimensions.get('window');

type SlideType =
  | 'overview'
  | 'tracking'
  | 'ai'
  | 'privacy';

type Slide = {
  id: string;
  type: SlideType;
  eyebrow: string;
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    id: 'overview',
    type: 'overview',
    eyebrow: 'YOUR HEALTH, ONE VIEW',
    title:
      'Understand your health at a glance',
    description:
      'See important health measurements, trends, and summaries in one clear dashboard.',
  },
  {
    id: 'tracking',
    type: 'tracking',
    eyebrow: 'TRACK WHAT MATTERS',
    title:
      'Turn daily measurements into useful trends',
    description:
      'Log the health information you choose to track and review changes over time.',
  },
  {
    id: 'ai',
    type: 'ai',
    eyebrow: 'PILOT AI',
    title:
      'Ask questions about your health information',
    description:
      'Pilot AI can help explain recorded vitals, health reports, and trends in simpler language.',
  },
  {
    id: 'privacy',
    type: 'privacy',
    eyebrow: 'PRIVATE & PATIENT-CONTROLLED',
    title:
      'Stay informed while keeping control',
    description:
      'Review alerts, reports, and provider-sharing choices while keeping your health information patient-controlled.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();

  const listRef =
    useRef<FlatList<Slide>>(null);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const lastSlide =
    currentIndex === slides.length - 1;

  const currentSlide = useMemo(
    () => slides[currentIndex],
    [currentIndex]
  );

  function goToSlide(index: number) {
    listRef.current?.scrollToIndex({
      index,
      animated: true,
    });

    setCurrentIndex(index);
  }

  function nextSlide() {
    if (lastSlide) {
      router.push('/signup');
      return;
    }

    goToSlide(currentIndex + 1);
  }

  function skipOnboarding() {
    router.push('/signin');
  }

  function handleScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const offset =
      event.nativeEvent.contentOffset.x;

    const index = Math.round(
      offset / SCREEN_WIDTH
    );

    setCurrentIndex(index);
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.replace('/welcome')
          }
          style={styles.brandButton}
        >
          <Image
            source={require('../../assets/images/vitalpilot/logo_green.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <Text style={styles.brandText}>
            VitalPilot
          </Text>
        </Pressable>

        {!lastSlide ? (
          <Pressable
            onPress={skipOnboarding}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>
              Skip
            </Text>
          </Pressable>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SlideContent slide={item} />
        )}
        onMomentumScrollEnd={
          handleScrollEnd
        }
        scrollEventThrottle={16}
      />

      {/* Bottom */}
      <View style={styles.bottomArea}>
        <View style={styles.indicatorRow}>
          {slides.map((slide, index) => {
            const selected =
              index === currentIndex;

            return (
              <Pressable
                key={slide.id}
                onPress={() =>
                  goToSlide(index)
                }
                style={[
                  styles.indicator,
                  selected &&
                    styles.indicatorSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Go to onboarding page ${
                  index + 1
                }`}
              />
            );
          })}
        </View>

        <Text style={styles.pageLabel}>
          {currentSlide.eyebrow}
        </Text>

        <Pressable
          onPress={nextSlide}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text
            style={styles.primaryButtonText}
          >
            {lastSlide
              ? 'Create Account'
              : currentIndex === 0
                ? 'Get Started'
                : 'Continue'}
          </Text>

          <Text
            style={styles.primaryButtonArrow}
          >
            →
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push('/signin')
          }
          style={({ pressed }) => [
            styles.signInButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.signInText}>
            {lastSlide
              ? 'Sign In Instead'
              : 'I already have an account'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SlideContent({
  slide,
}: {
  slide: Slide;
}) {
  return (
    <View
      style={[
        styles.slide,
        {
          width: SCREEN_WIDTH,
        },
      ]}
    >
      <View style={styles.visualContainer}>
        <View style={styles.decorativeCircleOne} />
        <View style={styles.decorativeCircleTwo} />

        {slide.type === 'overview' ? (
          <OverviewVisual />
        ) : null}

        {slide.type === 'tracking' ? (
          <TrackingVisual />
        ) : null}

        {slide.type === 'ai' ? (
          <AiVisual />
        ) : null}

        {slide.type === 'privacy' ? (
          <PrivacyVisual />
        ) : null}
      </View>

      <View style={styles.textSection}>
        <Text style={styles.eyebrow}>
          {slide.eyebrow}
        </Text>

        <Text style={styles.title}>
          {slide.title}
        </Text>

        <Text style={styles.description}>
          {slide.description}
        </Text>
      </View>
    </View>
  );
}

function OverviewVisual() {
  return (
    <View style={styles.dashboardMock}>
      <View style={styles.dashboardHeader}>
        <View>
          <Text
            style={styles.dashboardGreeting}
          >
            Good morning
          </Text>

          <Text
            style={styles.dashboardName}
          >
            Your health today
          </Text>
        </View>

        <View style={styles.miniNotification}>
          <Text
            style={
              styles.miniNotificationText
            }
          >
            !
          </Text>

          <View
            style={
              styles.notificationBadge
            }
          >
            <Text
              style={
                styles.notificationBadgeText
              }
            >
              2
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.healthCardRow}>
        <HealthMiniCard
          icon="♥"
          label="Heart Rate"
          value="72"
          unit="bpm"
          color="#15945C"
          background="#EAF8F0"
        />

        <HealthMiniCard
          icon="◉"
          label="Blood Pressure"
          value="120/80"
          unit=""
          color="#2E7EEA"
          background="#EAF2FF"
        />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartTitleRow}>
          <View>
            <Text
              style={styles.chartTitle}
            >
              Vitals Overview
            </Text>

            <Text
              style={styles.chartSubtitle}
            >
              Last 7 days
            </Text>
          </View>

          <View style={styles.goodBadge}>
            <Text
              style={styles.goodBadgeText}
            >
              Good
            </Text>
          </View>
        </View>

        <MiniLineChart />
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>
            85
          </Text>

          <Text style={styles.scoreOutOf}>
            /100
          </Text>
        </View>

        <View style={styles.scoreContent}>
          <Text style={styles.scoreTitle}>
            Health Summary
          </Text>

          <Text style={styles.scoreText}>
            Most tracked values are within
            your expected range.
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.greenDot} />

            <Text style={styles.statusText}>
              Vitals normal
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function TrackingVisual() {
  return (
    <View style={styles.trackingVisual}>
      <View style={styles.trackingHeader}>
        <Text style={styles.mockSectionTitle}>
          Today's Health
        </Text>

        <Text style={styles.mockLink}>
          View all
        </Text>
      </View>

      <View style={styles.metricGrid}>
        <MetricVisualCard
          icon="♥"
          title="Heart Rate"
          value="72 bpm"
          color="#15945C"
          background="#EAF8F0"
          bars={[15, 24, 20, 30, 25, 34, 29]}
        />

        <MetricVisualCard
          icon="◉"
          title="Blood Pressure"
          value="120/80"
          color="#2E7EEA"
          background="#EAF2FF"
          bars={[18, 28, 23, 33, 27, 31, 29]}
        />

        <MetricVisualCard
          icon="☾"
          title="Sleep"
          value="7h 30m"
          color="#8752D4"
          background="#F1EBFC"
          bars={[16, 22, 19, 30, 24, 34, 36]}
        />

        <MetricVisualCard
          icon="◈"
          title="Glucose"
          value="102 mg/dL"
          color="#F79009"
          background="#FFF4E5"
          bars={[24, 29, 25, 32, 27, 30, 26]}
        />
      </View>

      <View style={styles.logPreview}>
        <View style={styles.logPreviewIcon}>
          <Text style={styles.logPreviewIconText}>
            +
          </Text>
        </View>

        <View style={styles.logPreviewContent}>
          <Text style={styles.logPreviewTitle}>
            Log Health Data
          </Text>

          <Text style={styles.logPreviewText}>
            Record measurements using your
            preferred units.
          </Text>
        </View>

        <Text style={styles.logPreviewArrow}>
          →
        </Text>
      </View>
    </View>
  );
}

function AiVisual() {
  return (
    <View style={styles.aiVisual}>
      <View style={styles.aiHeader}>
        <View style={styles.aiLogo}>
          <Text style={styles.aiLogoText}>
            ✦
          </Text>
        </View>

        <View>
          <Text style={styles.aiHeaderTitle}>
            Pilot AI
          </Text>

          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />

            <Text style={styles.onlineText}>
              Health assistant
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.aiConversation}>
        <View style={styles.aiBubbleRow}>
          <View style={styles.aiAvatar}>
            <Text
              style={styles.aiAvatarText}
            >
              ✦
            </Text>
          </View>

          <View style={styles.assistantBubble}>
            <Text
              style={
                styles.assistantBubbleText
              }
            >
              How can I help with your health
              information today?
            </Text>
          </View>
        </View>

        <View style={styles.userBubbleRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userBubbleText}>
              What does my blood pressure mean?
            </Text>
          </View>
        </View>

        <View style={styles.aiBubbleRow}>
          <View style={styles.aiAvatar}>
            <Text
              style={styles.aiAvatarText}
            >
              ✦
            </Text>
          </View>

          <View style={styles.assistantBubbleLarge}>
            <Text
              style={
                styles.assistantBubbleText
              }
            >
              I can help explain your recorded
              reading and recent trends in
              simpler language.
            </Text>

            <View style={styles.aiActionButton}>
              <Text
                style={
                  styles.aiActionButtonText
                }
              >
                View My Vitals
              </Text>

              <Text
                style={
                  styles.aiActionArrow
                }
              >
                →
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quickPromptRow}>
        <View style={styles.quickPrompt}>
          <Text style={styles.quickPromptText}>
            Check Symptoms
          </Text>
        </View>

        <View style={styles.quickPrompt}>
          <Text style={styles.quickPromptText}>
            Explain Report
          </Text>
        </View>
      </View>
    </View>
  );
}

function PrivacyVisual() {
  return (
    <View style={styles.privacyVisual}>
      <View style={styles.shieldCircle}>
        <Text style={styles.shieldText}>
          ✓
        </Text>
      </View>

      <Text style={styles.privacyVisualTitle}>
        Your data. Your control.
      </Text>

      <Text style={styles.privacyVisualSubtitle}>
        Stay informed without losing control
        of your health information.
      </Text>

      <View style={styles.notificationPreview}>
        <View style={styles.notificationRow}>
          <View
            style={[
              styles.notificationPreviewIcon,
              {
                backgroundColor: '#EAF8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.notificationPreviewIconText,
                {
                  color: '#137A53',
                },
              ]}
            >
              ✓
            </Text>
          </View>

          <View style={styles.notificationTextArea}>
            <Text
              style={
                styles.notificationPreviewTitle
              }
            >
              Measurement saved
            </Text>

            <Text
              style={
                styles.notificationPreviewText
              }
            >
              Your health data was recorded.
            </Text>
          </View>
        </View>

        <View style={styles.notificationRow}>
          <View
            style={[
              styles.notificationPreviewIcon,
              {
                backgroundColor: '#FFF4E5',
              },
            ]}
          >
            <Text
              style={[
                styles.notificationPreviewIconText,
                {
                  color: '#B54708',
                },
              ]}
            >
              !
            </Text>
          </View>

          <View style={styles.notificationTextArea}>
            <Text
              style={
                styles.notificationPreviewTitle
              }
            >
              Health alert
            </Text>

            <Text
              style={
                styles.notificationPreviewText
              }
            >
              Review important health
              information.
            </Text>
          </View>

          <View
            style={
              styles.notificationPreviewBadge
            }
          >
            <Text
              style={
                styles.notificationPreviewBadgeText
              }
            >
              2
            </Text>
          </View>
        </View>

        <View style={styles.notificationRow}>
          <View
            style={[
              styles.notificationPreviewIcon,
              {
                backgroundColor: '#EAF2FF',
              },
            ]}
          >
            <Text
              style={[
                styles.notificationPreviewIconText,
                {
                  color: '#175CD3',
                },
              ]}
            >
              ▤
            </Text>
          </View>

          <View style={styles.notificationTextArea}>
            <Text
              style={
                styles.notificationPreviewTitle
              }
            >
              Weekly report ready
            </Text>

            <Text
              style={
                styles.notificationPreviewText
              }
            >
              Review your latest health summary.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.privacyFeatureGrid}>
        <PrivacyFeature
          icon="♥"
          text="Choose what you track"
        />

        <PrivacyFeature
          icon="✓"
          text="Control provider sharing"
        />

        <PrivacyFeature
          icon="!"
          text="Receive important alerts"
        />

        <PrivacyFeature
          icon="▤"
          text="Review health reports"
        />
      </View>
    </View>
  );
}

function HealthMiniCard({
  icon,
  label,
  value,
  unit,
  color,
  background,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  color: string;
  background: string;
}) {
  return (
    <View style={styles.healthMiniCard}>
      <View
        style={[
          styles.healthMiniIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <Text
          style={[
            styles.healthMiniIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.healthMiniLabel}>
        {label}
      </Text>

      <View style={styles.healthMiniValueRow}>
        <Text style={styles.healthMiniValue}>
          {value}
        </Text>

        {unit ? (
          <Text style={styles.healthMiniUnit}>
            {unit}
          </Text>
        ) : null}
      </View>

      <View style={styles.healthMiniStatus}>
        <View
          style={[
            styles.healthMiniDot,
            {
              backgroundColor: color,
            },
          ]}
        />

        <Text
          style={[
            styles.healthMiniStatusText,
            {
              color,
            },
          ]}
        >
          Normal
        </Text>
      </View>
    </View>
  );
}

function MetricVisualCard({
  icon,
  title,
  value,
  color,
  background,
  bars,
}: {
  icon: string;
  title: string;
  value: string;
  color: string;
  background: string;
  bars: number[];
}) {
  return (
    <View style={styles.metricVisualCard}>
      <View
        style={[
          styles.metricVisualIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <Text
          style={[
            styles.metricVisualIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.metricVisualTitle}>
        {title}
      </Text>

      <Text style={styles.metricVisualValue}>
        {value}
      </Text>

      <View style={styles.metricBars}>
        {bars.map((height, index) => (
          <View
            key={`${title}-${index}`}
            style={[
              styles.metricBar,
              {
                height,
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function PrivacyFeature({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <View style={styles.privacyFeature}>
      <View style={styles.privacyFeatureIcon}>
        <Text
          style={styles.privacyFeatureIconText}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.privacyFeatureText}>
        {text}
      </Text>
    </View>
  );
}

function MiniLineChart() {
  const values = [
    24,
    38,
    29,
    49,
    40,
    56,
    45,
  ];

  return (
    <View style={styles.lineChart}>
      <View style={styles.lineGridOne} />
      <View style={styles.lineGridTwo} />
      <View style={styles.lineGridThree} />

      <View style={styles.lineBars}>
        {values.map((height, index) => (
          <View
            key={index}
            style={styles.lineBarColumn}
          >
            <View
              style={[
                styles.lineBar,
                {
                  height,
                },
              ]}
            />

            <View
              style={[
                styles.linePoint,
                {
                  bottom: height - 3,
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.lineLabels}>
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
            style={styles.lineLabel}
          >
            {day}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },

  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 36,
    height: 36,
    marginRight: 7,
  },

  brandText: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '900',
  },

  skipButton: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  skipText: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },

  skipPlaceholder: {
    width: 56,
  },

  slide: {
    flex: 1,
    paddingHorizontal: 20,
  },

  visualContainer: {
    minHeight: 410,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: '#EFF8F3',
    borderWidth: 1,
    borderColor: '#DDEBE3',
    padding: 16,
  },

  decorativeCircleOne: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor:
      'rgba(21,148,92,0.06)',
    top: -80,
    right: -60,
  },

  decorativeCircleTwo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor:
      'rgba(135,82,212,0.04)',
    bottom: -60,
    left: -45,
  },

  textSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 23,
  },

  eyebrow: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  title: {
    maxWidth: 355,
    color: '#101828',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },

  description: {
    maxWidth: 350,
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  bottomArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },

  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D5DD',
  },

  indicatorSelected: {
    width: 27,
    backgroundColor:
      VitalPilotColors.primary,
  },

  pageLabel: {
    color: '#98A2B3',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    textAlign: 'center',
    marginTop: 10,
  },

  primaryButton: {
    minHeight: 52,
    marginTop: 13,
    backgroundColor:
      VitalPilotColors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  primaryButtonArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  signInButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  signInText: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },

  /*
   * Overview visual
   */

  dashboardMock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E1E7E4',
    padding: 15,
  },

  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dashboardGreeting: {
    color: '#98A2B3',
    fontSize: 8,
    fontWeight: '600',
  },

  dashboardName: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },

  miniNotification: {
    width: 37,
    height: 37,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  miniNotificationText: {
    color: '#475467',
    fontSize: 15,
    fontWeight: '900',
  },

  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D92D20',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },

  healthCardRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },

  healthMiniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 15,
    padding: 10,
  },

  healthMiniIcon: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  healthMiniIconText: {
    fontSize: 12,
    fontWeight: '900',
  },

  healthMiniLabel: {
    color: '#667085',
    fontSize: 7,
    fontWeight: '700',
    marginTop: 7,
  },

  healthMiniValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 3,
  },

  healthMiniValue: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900',
  },

  healthMiniUnit: {
    color: '#98A2B3',
    fontSize: 6,
  },

  healthMiniStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  healthMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
  },

  healthMiniStatusText: {
    fontSize: 7,
    fontWeight: '700',
  },

  chartCard: {
    backgroundColor: '#FAFCFB',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E7ECE9',
    padding: 11,
    marginTop: 10,
  },

  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  chartTitle: {
    color: '#101828',
    fontSize: 10,
    fontWeight: '800',
  },

  chartSubtitle: {
    color: '#98A2B3',
    fontSize: 6,
    marginTop: 2,
  },

  goodBadge: {
    backgroundColor: '#EAF8F0',
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  goodBadgeText: {
    color: '#137A53',
    fontSize: 6,
    fontWeight: '800',
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FBF8',
    borderRadius: 15,
    padding: 10,
    marginTop: 10,
  },

  scoreCircle: {
    width: 61,
    height: 61,
    borderRadius: 31,
    borderWidth: 6,
    borderColor:
      VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreNumber: {
    color: '#101828',
    fontSize: 16,
    fontWeight: '900',
  },

  scoreOutOf: {
    color: '#98A2B3',
    fontSize: 6,
  },

  scoreContent: {
    flex: 1,
    marginLeft: 11,
  },

  scoreTitle: {
    color: '#101828',
    fontSize: 10,
    fontWeight: '800',
  },

  scoreText: {
    color: '#667085',
    fontSize: 7,
    lineHeight: 11,
    marginTop: 3,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#15945C',
    marginRight: 4,
  },

  statusText: {
    color: '#137A53',
    fontSize: 7,
    fontWeight: '700',
  },

  lineChart: {
    height: 92,
    position: 'relative',
    marginTop: 7,
  },

  lineGridOne: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    height: 1,
    backgroundColor: '#EDEFEF',
  },

  lineGridTwo: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 42,
    height: 1,
    backgroundColor: '#EDEFEF',
  },

  lineGridThree: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 64,
    height: 1,
    backgroundColor: '#EDEFEF',
  },

  lineBars: {
    height: 67,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  lineBarColumn: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },

  lineBar: {
    width: 2,
    backgroundColor:
      VitalPilotColors.primary,
    borderRadius: 2,
  },

  linePoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      VitalPilotColors.primary,
  },

  lineLabels: {
    flexDirection: 'row',
  },

  lineLabel: {
    flex: 1,
    color: '#98A2B3',
    fontSize: 6,
    textAlign: 'center',
  },

  /*
   * Tracking visual
   */

  trackingVisual: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E1E7E4',
    padding: 14,
  },

  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mockSectionTitle: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '900',
  },

  mockLink: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 7,
    fontWeight: '800',
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  metricVisualCard: {
    width: '48%',
    minHeight: 124,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 15,
    padding: 10,
  },

  metricVisualIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricVisualIconText: {
    fontSize: 12,
    fontWeight: '900',
  },

  metricVisualTitle: {
    color: '#667085',
    fontSize: 7,
    fontWeight: '700',
    marginTop: 7,
  },

  metricVisualValue: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },

  metricBars: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 'auto',
  },

  metricBar: {
    flex: 1,
    maxWidth: 4,
    borderRadius: 3,
  },

  logPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8F4',
    borderRadius: 15,
    padding: 11,
    marginTop: 10,
  },

  logPreviewIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor:
      VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logPreviewIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  logPreviewContent: {
    flex: 1,
    marginLeft: 9,
  },

  logPreviewTitle: {
    color: '#101828',
    fontSize: 9,
    fontWeight: '800',
  },

  logPreviewText: {
    color: '#667085',
    fontSize: 6,
    lineHeight: 10,
    marginTop: 2,
  },

  logPreviewArrow: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 14,
  },

  /*
   * AI visual
   */

  aiVisual: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E1E7E4',
    padding: 14,
  },

  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  aiLogoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  aiHeaderTitle: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '900',
  },

  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#15945C',
    marginRight: 4,
  },

  onlineText: {
    color: '#667085',
    fontSize: 7,
  },

  aiConversation: {
    marginTop: 15,
    gap: 10,
  },

  aiBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  aiAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor:
      VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  aiAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  assistantBubble: {
    maxWidth: '77%',
    backgroundColor: '#F4F7F5',
    borderRadius: 13,
    borderTopLeftRadius: 4,
    padding: 9,
  },

  assistantBubbleLarge: {
    maxWidth: '79%',
    backgroundColor: '#F4F7F5',
    borderRadius: 13,
    borderTopLeftRadius: 4,
    padding: 9,
  },

  assistantBubbleText: {
    color: '#475467',
    fontSize: 8,
    lineHeight: 12,
  },

  userBubbleRow: {
    alignItems: 'flex-end',
  },

  userBubble: {
    maxWidth: '72%',
    backgroundColor:
      VitalPilotColors.primary,
    borderRadius: 13,
    borderTopRightRadius: 4,
    padding: 9,
  },

  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 8,
    lineHeight: 12,
  },

  aiActionButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F4EC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 7,
  },

  aiActionButtonText: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 7,
    fontWeight: '800',
  },

  aiActionArrow: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 8,
    marginLeft: 4,
  },

  quickPromptRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
  },

  quickPrompt: {
    flex: 1,
    minHeight: 35,
    borderWidth: 1,
    borderColor: '#DCE7E1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickPromptText: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 7,
    fontWeight: '700',
  },

  /*
   * Privacy visual
   */

  privacyVisual: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E1E7E4',
    padding: 15,
    alignItems: 'center',
  },

  shieldCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EAF8F0',
    borderWidth: 2,
    borderColor:
      VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shieldText: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 24,
    fontWeight: '900',
  },

  privacyVisualTitle: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 10,
  },

  privacyVisualSubtitle: {
    maxWidth: 255,
    color: '#667085',
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  notificationPreview: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    overflow: 'hidden',
    marginTop: 13,
  },

  notificationRow: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },

  notificationPreviewIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  notificationPreviewIconText: {
    fontSize: 11,
    fontWeight: '900',
  },

  notificationTextArea: {
    flex: 1,
  },

  notificationPreviewTitle: {
    color: '#101828',
    fontSize: 8,
    fontWeight: '800',
  },

  notificationPreviewText: {
    color: '#667085',
    fontSize: 6,
    marginTop: 2,
  },

  notificationPreviewBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D92D20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationPreviewBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },

  privacyFeatureGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },

  privacyFeature: {
    width: '48%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderRadius: 11,
    paddingHorizontal: 8,
  },

  privacyFeatureIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EAF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  privacyFeatureIconText: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 9,
    fontWeight: '900',
  },

  privacyFeatureText: {
    flex: 1,
    color: '#475467',
    fontSize: 6,
    lineHeight: 9,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.65,
  },
});