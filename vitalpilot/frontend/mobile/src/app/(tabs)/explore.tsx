import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalCard } from '@/components/vitalpilot/card';
import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';

type FeatureRoute =
  | '/metrics'
  | '/chatbot'
  | '/reports'
  | '/doctors'
  | '/profile';

type Feature = {
  title: string;
  description: string;
  route: FeatureRoute;
};

const features: Feature[] = [
  {
    title: 'Health Metrics',
    description:
      'Record blood pressure, glucose, oxygen, sleep, activity, water, and more.',
    route: '/metrics',
  },
  {
    title: 'Pilot AI',
    description:
      'Describe symptoms and ask health-related questions.',
    route: '/chatbot',
  },
  {
    title: 'Health Reports',
    description:
      'Review health trends and prepare a progress report.',
    route: '/reports',
  },
  {
    title: 'Find a Doctor',
    description:
      'Search for providers and manage patient-controlled sharing.',
    route: '/doctors',
  },
  {
    title: 'Patient Profile',
    description:
      'Manage your information and monitoring preferences.',
    route: '/profile',
  },
];

export default function ExploreScreen() {
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
        <Text style={styles.title}>
          Explore VitalPilot
        </Text>

        <Text style={styles.subtitle}>
          Quick access to your health monitoring,
          AI, reporting, and provider tools.
        </Text>

        <View style={styles.list}>
          {features.map((feature) => (
            <Pressable
              key={feature.title}
              onPress={() =>
                router.push(feature.route)
              }
              style={({ pressed }) => [
                pressed && styles.pressed,
              ]}
            >
              <VitalCard>
                <Text style={styles.cardTitle}>
                  {feature.title}
                </Text>

                <Text style={styles.cardDescription}>
                  {feature.description}
                </Text>

                <Text style={styles.link}>
                  Open →
                </Text>
              </VitalCard>
            </Pressable>
          ))}
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
    paddingBottom: BottomTabInset + 32,
    gap: 10,
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
    marginBottom: 10,
  },

  list: {
    gap: 12,
  },

  cardTitle: {
    color: VitalPilotColors.title,
    fontSize: 18,
    fontWeight: '800',
  },

  cardDescription: {
    color: '#667085',
    lineHeight: 21,
  },

  link: {
    color: VitalPilotColors.primaryDark,
    fontWeight: '800',
    marginTop: 4,
  },

  pressed: {
    opacity: 0.8,
  },
});