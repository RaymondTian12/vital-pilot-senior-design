import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalButton } from '@/components/vitalpilot/button';
import { VitalCard } from '@/components/vitalpilot/card';
import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';
import { api } from '@/services/api';

const metricTypes = [
  'Blood Pressure',
  'Blood Glucose',
  'Blood Oxygen',
  'Peak Flow',
  'Sleep',
  'Physical Activity',
  'Water Intake',
  'Weight',
];

export default function MetricsScreen() {
  const [selectedMetric, setSelectedMetric] = useState(metricTypes[0]);
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function saveMeasurement() {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setMessage('Enter a measurement before saving.');
      return;
    }

    setMessage('');
    setIsSaving(true);

    try {
      if (process.env.EXPO_PUBLIC_API_BASE_URL) {
        await api.submitMetric(
          selectedMetric,
          trimmedValue
        );
      }

      setMessage('Measurement saved successfully.');
      setValue('');
    } catch {
      setMessage(
        'Unable to save the measurement right now.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function selectMetric(metric: string) {
    setSelectedMetric(metric);
    setMessage('');
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
          Log Health Data
        </Text>

        <Text style={styles.subtitle}>
          Choose a metric and enter the value using the
          appropriate unit.
        </Text>

        <VitalCard>
          <Text style={styles.label}>
            Metric
          </Text>

          <View style={styles.choices}>
            {metricTypes.map((metric) => {
              const isSelected =
                selectedMetric === metric;

              return (
                <Pressable
                  key={metric}
                  onPress={() => selectMetric(metric)}
                  style={({ pressed }) => [
                    styles.choice,
                    isSelected &&
                      styles.choiceSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      isSelected &&
                        styles.choiceTextSelected,
                    ]}
                  >
                    {isSelected ? '✓ ' : ''}
                    {metric}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>
            Measurement
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Enter value"
            placeholderTextColor="#98A2B3"
            keyboardType="decimal-pad"
            style={styles.input}
          />

          {message ? (
            <Text style={styles.message}>
              {message}
            </Text>
          ) : null}

          <VitalButton
            onPress={saveMeasurement}
            disabled={isSaving}
          >
            {isSaving
              ? 'Saving...'
              : 'Save Measurement'}
          </VitalButton>
        </VitalCard>
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
    gap: 12,
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
    marginBottom: 6,
  },

  label: {
    color: VitalPilotColors.title,
    fontWeight: '800',
    marginTop: 4,
  },

  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  choice: {
    borderWidth: 1,
    borderColor: VitalPilotColors.border,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  choiceSelected: {
    backgroundColor: VitalPilotColors.mintStrong,
    borderColor: VitalPilotColors.primary,
  },

  choiceText: {
    color: '#52635B',
    fontSize: 13,
    fontWeight: '600',
  },

  choiceTextSelected: {
    color: VitalPilotColors.primaryDark,
    fontWeight: '800',
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: VitalPilotColors.title,
    backgroundColor: '#FFFFFF',
  },

  message: {
    color: '#667085',
    fontSize: 14,
  },

  pressed: {
    opacity: 0.8,
  },
});