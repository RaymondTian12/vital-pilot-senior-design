import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalButton } from '@/components/vitalpilot/button';
import { VitalPilotLogo } from '@/components/vitalpilot/logo';
import { VitalPilotColors } from '@/constants/vitalpilot';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: 'health',
    title: 'Track the health metrics that matter',
    description:
      'Record vital signs and daily lifestyle information in one consistent place.',
    image: require('@/assets/images/vitalpilot/phone_scrolling.png'),
  },
  {
    id: 'reports',
    title: 'Understand changes over time',
    description:
      'Review trends, alerts, and summaries designed to make your health history easier to understand.',
    image: require('@/assets/images/vitalpilot/phone_scrolling.png'),
  },
  {
    id: 'ai',
    title: 'Talk with Pilot AI',
    description:
      'Describe symptoms and ask health-related questions through VitalPilot’s conversational interface.',
    image: require('@/assets/images/vitalpilot/ai_description_11.png'),
  },
  {
    id: 'doctor',
    title: 'Share information with your provider',
    description:
      'Generate reports and choose when to share your health information with a healthcare provider.',
    image: require('@/assets/images/vitalpilot/doctor_description.png'),
  },
];

export default function WelcomeScreen() {
  const router = useRouter();

  const scrollRef = useRef<ScrollView>(null);

  const [currentSlide, setCurrentSlide] = useState(0);

  function handleScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const offsetX =
      event.nativeEvent.contentOffset.x;

    const nextIndex = Math.round(
      offsetX / width
    );

    setCurrentSlide(nextIndex);
  }

  function goNext() {
    const nextSlide = Math.min(
      currentSlide + 1,
      slides.length - 1
    );

    scrollRef.current?.scrollTo({
      x: nextSlide * width,
      animated: true,
    });

    setCurrentSlide(nextSlide);
  }

  const isLastSlide =
    currentSlide === slides.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.brandRow}>
        <VitalPilotLogo size={42} />

        <Text style={styles.brandName}>
          VitalPilot
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={styles.slide}
          >
            <Image
              source={slide.image}
              style={styles.image}
              contentFit="contain"
            />

            <Text style={styles.title}>
              {slide.title}
            </Text>

            <Text style={styles.description}>
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                index === currentSlide &&
                  styles.activeDot,
              ]}
            />
          ))}
        </View>

        {!isLastSlide ? (
          <VitalButton onPress={goNext}>
            Next
          </VitalButton>
        ) : (
          <View style={styles.authButtons}>
            <VitalButton
              onPress={() =>
                router.push('/signup')
              }
            >
              Create Account
            </VitalButton>

            <VitalButton
              variant="secondary"
              onPress={() =>
                router.push('/signin')
              }
            >
              Sign In
            </VitalButton>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VitalPilotColors.white,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  brandName: {
    color: VitalPilotColors.title,
    fontSize: 21,
    fontWeight: '800',
  },

  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  image: {
    width: width - 56,
    height: 290,
    marginBottom: 26,
    borderRadius: 24,
  },

  title: {
    color: VitalPilotColors.title,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },

  description: {
    maxWidth: 420,
    color: '#667085',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    gap: 18,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D5DD',
  },

  activeDot: {
    width: 24,
    backgroundColor: VitalPilotColors.primary,
  },

  authButtons: {
    gap: 12,
  },
});