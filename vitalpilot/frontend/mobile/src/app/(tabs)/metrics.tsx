import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

type MetricType =
  | 'Blood Pressure'
  | 'Blood Glucose'
  | 'Blood Oxygen'
  | 'Peak Flow'
  | 'Sleep'
  | 'Physical Activity'
  | 'Water Intake'
  | 'Weight';

type WeightUnit = 'lb' | 'kg';

type WaterUnit = 'oz' | 'mL';

type RecentMeasurement = {
  id: string;
  metric: string;
  value: string;
  time: string;
};

const metricTypes: {
  name: MetricType;
  icon: string;
}[] = [
  {
    name: 'Blood Pressure',
    icon: '♥',
  },
  {
    name: 'Blood Glucose',
    icon: '◈',
  },
  {
    name: 'Blood Oxygen',
    icon: '◉',
  },
  {
    name: 'Peak Flow',
    icon: '⌁',
  },
  {
    name: 'Sleep',
    icon: '☾',
  },
  {
    name: 'Physical Activity',
    icon: '↗',
  },
  {
    name: 'Water Intake',
    icon: '◒',
  },
  {
    name: 'Weight',
    icon: '▣',
  },
];

const recentMeasurements: RecentMeasurement[] = [
  {
    id: '1',
    metric: 'Blood Pressure',
    value: '120/80 mmHg',
    time: 'Today, 8:42 AM',
  },
  {
    id: '2',
    metric: 'Blood Glucose',
    value: '102 mg/dL',
    time: 'Yesterday, 7:30 AM',
  },
  {
    id: '3',
    metric: 'Blood Oxygen',
    value: '98%',
    time: 'Yesterday, 7:15 AM',
  },
  {
    id: '4',
    metric: 'Weight',
    value: '68.0 kg',
    time: '2 days ago',
  },
];

export default function MetricsScreen() {
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>('Blood Pressure');

  const [primaryValue, setPrimaryValue] =
    useState('');

  const [secondaryValue, setSecondaryValue] =
    useState('');

  const [note, setNote] = useState('');

  const [weightUnit, setWeightUnit] =
    useState<WeightUnit>('kg');

  const [waterUnit, setWaterUnit] =
    useState<WaterUnit>('mL');

  const [message, setMessage] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'Blood Pressure':
        return {
          primaryLabel: 'Systolic',
          primaryPlaceholder: '120',
          primaryUnit: 'mmHg',

          secondaryLabel: 'Diastolic',
          secondaryPlaceholder: '80',
          secondaryUnit: 'mmHg',
        };

      case 'Blood Glucose':
        return {
          primaryLabel: 'Blood Glucose',
          primaryPlaceholder: '102',
          primaryUnit: 'mg/dL',
        };

      case 'Blood Oxygen':
        return {
          primaryLabel: 'Blood Oxygen',
          primaryPlaceholder: '98',
          primaryUnit: '%',
        };

      case 'Peak Flow':
        return {
          primaryLabel: 'Peak Flow',
          primaryPlaceholder: '450',
          primaryUnit: 'L/min',
        };

      case 'Sleep':
        return {
          primaryLabel: 'Hours',
          primaryPlaceholder: '7',
          primaryUnit: 'hr',

          secondaryLabel: 'Minutes',
          secondaryPlaceholder: '30',
          secondaryUnit: 'min',
        };

      case 'Physical Activity':
        return {
          primaryLabel: 'Activity Duration',
          primaryPlaceholder: '30',
          primaryUnit: 'min',
        };

      case 'Water Intake':
        return {
          primaryLabel: 'Water Intake',

          primaryPlaceholder:
            waterUnit === 'mL'
              ? '500'
              : '16',

          primaryUnit: waterUnit,
        };

      case 'Weight':
        return {
          primaryLabel: 'Weight',

          primaryPlaceholder:
            weightUnit === 'kg'
              ? '68'
              : '150',

          primaryUnit: weightUnit,
        };
    }
  }, [
    selectedMetric,
    waterUnit,
    weightUnit,
  ]);

  function selectMetric(
    metric: MetricType
  ) {
    setSelectedMetric(metric);

    setPrimaryValue('');
    setSecondaryValue('');
    setNote('');
    setMessage('');
  }

  function poundsToKilograms(
    pounds: number
  ) {
    return pounds * 0.45359237;
  }

  function ouncesToMilliliters(
    ounces: number
  ) {
    return ounces * 29.5735;
  }

  function validateMeasurement() {
    if (!primaryValue.trim()) {
      return 'Enter a measurement before saving.';
    }

    const primaryNumber =
      Number(primaryValue);

    if (Number.isNaN(primaryNumber)) {
      return 'Enter a valid numeric value.';
    }

    if (primaryNumber <= 0) {
      return 'Measurement must be greater than zero.';
    }

    if (
      selectedMetric ===
      'Blood Pressure'
    ) {
      if (!secondaryValue.trim()) {
        return 'Enter both systolic and diastolic values.';
      }

      const diastolic =
        Number(secondaryValue);

      if (Number.isNaN(diastolic)) {
        return 'Enter a valid diastolic value.';
      }

      if (diastolic <= 0) {
        return 'Diastolic pressure must be greater than zero.';
      }
    }

    if (
      selectedMetric ===
        'Blood Oxygen' &&
      (primaryNumber < 50 ||
        primaryNumber > 100)
    ) {
      return 'Blood oxygen must be entered as a percentage between 50 and 100.';
    }

    if (
      selectedMetric === 'Sleep'
    ) {
      if (
        secondaryValue &&
        Number.isNaN(
          Number(secondaryValue)
        )
      ) {
        return 'Enter valid sleep minutes.';
      }

      if (
        secondaryValue &&
        Number(secondaryValue) >= 60
      ) {
        return 'Minutes must be less than 60.';
      }

      if (
        Number(primaryValue) > 24
      ) {
        return 'Sleep hours cannot be greater than 24.';
      }
    }

    if (
      selectedMetric ===
        'Blood Glucose' &&
      primaryNumber > 1000
    ) {
      return 'Please check the blood glucose value.';
    }

    if (
      selectedMetric === 'Weight' &&
      weightUnit === 'kg' &&
      primaryNumber > 500
    ) {
      return 'Please check the weight value.';
    }

    if (
      selectedMetric === 'Weight' &&
      weightUnit === 'lb' &&
      primaryNumber > 1100
    ) {
      return 'Please check the weight value.';
    }

    if (
      selectedMetric ===
        'Water Intake' &&
      waterUnit === 'mL' &&
      primaryNumber > 10000
    ) {
      return 'Please check the water intake value.';
    }

    return '';
  }

  function buildMeasurementValue() {
    const primaryNumber =
      Number(primaryValue.trim());

    if (
      selectedMetric ===
      'Blood Pressure'
    ) {
      return `${primaryValue.trim()}/${secondaryValue.trim()}`;
    }

    if (
      selectedMetric === 'Sleep'
    ) {
      return `${primaryValue.trim()}h ${
        secondaryValue.trim() || '0'
      }m`;
    }

    if (
      selectedMetric === 'Weight'
    ) {
      const weightInKg =
        weightUnit === 'kg'
          ? primaryNumber
          : poundsToKilograms(
              primaryNumber
            );

      return weightInKg.toFixed(2);
    }

    if (
      selectedMetric ===
      'Water Intake'
    ) {
      const waterInMl =
        waterUnit === 'mL'
          ? primaryNumber
          : ouncesToMilliliters(
              primaryNumber
            );

      return waterInMl.toFixed(0);
    }

    return primaryValue.trim();
  }

  async function saveMeasurement() {
    const validationError =
      validateMeasurement();

    if (validationError) {
      setMessage(
        validationError
      );
      return;
    }

    setMessage('');
    setIsSaving(true);

    const measurementValue =
      buildMeasurementValue();

    try {
      if (
        process.env
          .EXPO_PUBLIC_API_BASE_URL
      ) {
        await api.submitMetric(
          selectedMetric,
          measurementValue
        );
      }

      setMessage(
        'Measurement saved successfully.'
      );

      setPrimaryValue('');
      setSecondaryValue('');
      setNote('');
    } catch {
      setMessage(
        'Unable to save the measurement right now.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.title}>
              Log Health Data
            </Text>

            <Text
              style={styles.subtitle}
            >
              Record your latest health
              measurement.
            </Text>
          </View>

          <Text
            style={styles.sectionTitle}
          >
            What would you like to
            record?
          </Text>

          <View
            style={styles.metricGrid}
          >
            {metricTypes.map(
              (metric) => {
                const selected =
                  selectedMetric ===
                  metric.name;

                return (
                  <Pressable
                    key={metric.name}
                    onPress={() =>
                      selectMetric(
                        metric.name
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Log ${metric.name}`}
                    style={
                      selected
                        ? styles.metricChoiceSelected
                        : styles.metricChoice
                    }
                  >
                    <View
                      style={
                        selected
                          ? styles.metricIconSelected
                          : styles.metricIcon
                      }
                    >
                      <Text
                        style={
                          selected
                            ? styles.metricIconTextSelected
                            : styles.metricIconText
                        }
                      >
                        {metric.icon}
                      </Text>
                    </View>

                    <Text
                      style={
                        selected
                          ? styles.metricChoiceTextSelected
                          : styles.metricChoiceText
                      }
                    >
                      {metric.name}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          <VitalCard
            style={styles.entryCard}
          >
            <View
              style={
                styles.entryHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.entryTitle
                  }
                >
                  {selectedMetric}
                </Text>

                <Text
                  style={
                    styles.entrySubtitle
                  }
                >
                  Enter your latest
                  measurement.
                </Text>
              </View>

              <View
                style={styles.nowBadge}
              >
                <Text
                  style={styles.nowText}
                >
                  Now
                </Text>
              </View>
            </View>

            {selectedMetric ===
            'Weight' ? (
              <View
                style={
                  styles.unitSection
                }
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Unit
                </Text>

                <View
                  style={
                    styles.unitSelector
                  }
                >
                  <UnitButton
                    label="kg"
                    selected={
                      weightUnit ===
                      'kg'
                    }
                    onPress={() =>
                      setWeightUnit(
                        'kg'
                      )
                    }
                  />

                  <UnitButton
                    label="lb"
                    selected={
                      weightUnit ===
                      'lb'
                    }
                    onPress={() =>
                      setWeightUnit(
                        'lb'
                      )
                    }
                  />
                </View>
              </View>
            ) : null}

            {selectedMetric ===
            'Water Intake' ? (
              <View
                style={
                  styles.unitSection
                }
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Unit
                </Text>

                <View
                  style={
                    styles.unitSelector
                  }
                >
                  <UnitButton
                    label="mL"
                    selected={
                      waterUnit ===
                      'mL'
                    }
                    onPress={() =>
                      setWaterUnit(
                        'mL'
                      )
                    }
                  />

                  <UnitButton
                    label="oz"
                    selected={
                      waterUnit ===
                      'oz'
                    }
                    onPress={() =>
                      setWaterUnit(
                        'oz'
                      )
                    }
                  />
                </View>
              </View>
            ) : null}

            <MeasurementInput
              label={
                metricConfig.primaryLabel
              }
              value={primaryValue}
              onChangeText={
                setPrimaryValue
              }
              placeholder={
                metricConfig.primaryPlaceholder
              }
              unit={
                metricConfig.primaryUnit
              }
            />

            {metricConfig.secondaryLabel ? (
              <MeasurementInput
                label={
                  metricConfig.secondaryLabel
                }
                value={secondaryValue}
                onChangeText={
                  setSecondaryValue
                }
                placeholder={
                  metricConfig.secondaryPlaceholder ??
                  ''
                }
                unit={
                  metricConfig.secondaryUnit ??
                  ''
                }
              />
            ) : null}

            {selectedMetric ===
              'Weight' &&
            primaryValue.trim() ? (
              <WeightConversionPreview
                value={primaryValue}
                unit={weightUnit}
              />
            ) : null}

            {selectedMetric ===
              'Water Intake' &&
            primaryValue.trim() ? (
              <WaterConversionPreview
                value={primaryValue}
                unit={waterUnit}
              />
            ) : null}

            <View
              style={styles.noteSection}
            >
              <Text
                style={
                  styles.inputLabel
                }
              >
                Note
                <Text
                  style={
                    styles.optional
                  }
                >
                  {' '}
                  optional
                </Text>
              </Text>

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Example: After breakfast"
                placeholderTextColor="#98A2B3"
                style={
                  styles.noteInput
                }
                multiline
                textAlignVertical="top"
              />
            </View>

            {message ? (
              <View
                style={
                  message.includes(
                    'successfully'
                  )
                    ? styles.successBox
                    : styles.messageBox
                }
              >
                <Text
                  style={
                    message.includes(
                      'successfully'
                    )
                      ? styles.successText
                      : styles.messageText
                  }
                >
                  {message}
                </Text>
              </View>
            ) : null}

            <VitalButton
              onPress={
                saveMeasurement
              }
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : 'Save Measurement'}
            </VitalButton>
          </VitalCard>

          <View
            style={
              styles.recentHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Recent Measurements
            </Text>

            <Pressable>
              <Text
                style={styles.viewAll}
              >
                View all
              </Text>
            </Pressable>
          </View>

          <View
            style={styles.recentList}
          >
            {recentMeasurements.map(
              (measurement) => (
                <View
                  key={
                    measurement.id
                  }
                  style={
                    styles.recentItem
                  }
                >
                  <View
                    style={
                      styles.recentIcon
                    }
                  >
                    <Text
                      style={
                        styles.recentIconText
                      }
                    >
                      ✓
                    </Text>
                  </View>

                  <View
                    style={
                      styles.recentInfo
                    }
                  >
                    <Text
                      style={
                        styles.recentMetric
                      }
                    >
                      {
                        measurement.metric
                      }
                    </Text>

                    <Text
                      style={
                        styles.recentTime
                      }
                    >
                      {
                        measurement.time
                      }
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.recentValue
                    }
                  >
                    {
                      measurement.value
                    }
                  </Text>
                </View>
              )
            )}
          </View>

          <View
            style={
              styles.reminderCard
            }
          >
            <Text
              style={
                styles.reminderTitle
              }
            >
              Keep your health history
              accurate
            </Text>

            <Text
              style={
                styles.reminderText
              }
            >
              Enter measurements
              exactly as shown on your
              device or provided by your
              healthcare professional.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MeasurementInput({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  unit: string;
}) {
  return (
    <View
      style={
        styles.measurementSection
      }
    >
      <Text
        style={styles.inputLabel}
      >
        {label}
      </Text>

      <View
        style={styles.inputContainer}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#98A2B3"
          keyboardType="decimal-pad"
          style={styles.input}
          accessibilityLabel={label}
        />

        <View
          style={
            styles.unitContainer
          }
        >
          <Text
            style={styles.unitText}
          >
            {unit}
          </Text>
        </View>
      </View>
    </View>
  );
}

function UnitButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{
        selected,
      }}
      style={
        selected
          ? styles.unitOptionSelected
          : styles.unitOption
      }
    >
      <Text
        style={
          selected
            ? styles.unitOptionTextSelected
            : styles.unitOptionText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function WeightConversionPreview({
  value,
  unit,
}: {
  value: string;
  unit: WeightUnit;
}) {
  const numericValue =
    Number(value);

  if (
    Number.isNaN(numericValue) ||
    numericValue <= 0
  ) {
    return null;
  }

  if (unit === 'kg') {
    const pounds =
      numericValue /
      0.45359237;

    return (
      <ConversionPreview
        text={`${numericValue.toFixed(
          1
        )} kg ≈ ${pounds.toFixed(
          1
        )} lb`}
      />
    );
  }

  const kilograms =
    numericValue *
    0.45359237;

  return (
    <ConversionPreview
      text={`${numericValue.toFixed(
        1
      )} lb ≈ ${kilograms.toFixed(
        1
      )} kg`}
    />
  );
}

function WaterConversionPreview({
  value,
  unit,
}: {
  value: string;
  unit: WaterUnit;
}) {
  const numericValue =
    Number(value);

  if (
    Number.isNaN(numericValue) ||
    numericValue <= 0
  ) {
    return null;
  }

  if (unit === 'mL') {
    const ounces =
      numericValue / 29.5735;

    return (
      <ConversionPreview
        text={`${numericValue.toFixed(
          0
        )} mL ≈ ${ounces.toFixed(
          1
        )} oz`}
      />
    );
  }

  const milliliters =
    numericValue * 29.5735;

  return (
    <ConversionPreview
      text={`${numericValue.toFixed(
        1
      )} oz ≈ ${milliliters.toFixed(
        0
      )} mL`}
    />
  );
}

function ConversionPreview({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.conversionPreview
      }
    >
      <Text
        style={
          styles.conversionLabel
        }
      >
        Converted value
      </Text>

      <Text
        style={
          styles.conversionValue
        }
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom:
      BottomTabInset + 36,
    gap: 18,
  },

  title: {
    color:
      VitalPilotColors.title,
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    color: '#667085',
    fontSize: 15,
    marginTop: 4,
  },

  sectionTitle: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '800',
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  metricChoice: {
    width: '48%',
    minHeight: 94,

    backgroundColor:
      '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E0E6E3',
    borderRadius: 16,

    padding: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  metricChoiceSelected: {
    width: '48%',
    minHeight: 94,

    backgroundColor:
      '#ECF8F2',

    borderWidth: 1.5,
    borderColor:
      VitalPilotColors.primary,
    borderRadius: 16,

    padding: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  metricIcon: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor:
      '#F2F4F7',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 7,
  },

  metricIconSelected: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor:
      '#DDF3E8',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 7,
  },

  metricIconText: {
    color: '#667085',
    fontSize: 17,
  },

  metricIconTextSelected: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
  },

  metricChoiceText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  metricChoiceTextSelected: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  entryCard: {
    gap: 17,
  },

  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  entryTitle: {
    color: '#101828',
    fontSize: 19,
    fontWeight: '800',
  },

  entrySubtitle: {
    color: '#667085',
    fontSize: 12,
    marginTop: 3,
  },

  nowBadge: {
    backgroundColor:
      '#EEF8F2',

    borderRadius: 12,

    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  nowText: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },

  unitSection: {
    gap: 8,
  },

  unitSelector: {
    flexDirection: 'row',
    gap: 8,
  },

  unitOption: {
    minWidth: 72,

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,

    backgroundColor:
      '#FFFFFF',

    alignItems: 'center',
  },

  unitOptionSelected: {
    minWidth: 72,

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderWidth: 1,
    borderColor:
      VitalPilotColors.primary,
    borderRadius: 12,

    backgroundColor:
      '#ECF8F2',

    alignItems: 'center',
  },

  unitOptionText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },

  unitOptionTextSelected: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },

  measurementSection: {
    gap: 7,
  },

  inputLabel: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },

  optional: {
    color: '#98A2B3',
    fontWeight: '400',
  },

  inputContainer: {
    minHeight: 56,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,

    backgroundColor:
      '#FFFFFF',

    overflow: 'hidden',
  },

  input: {
    flex: 1,
    minHeight: 54,

    paddingHorizontal: 16,

    color: '#101828',

    fontSize: 20,
    fontWeight: '700',
  },

  unitContainer: {
    alignSelf: 'stretch',

    justifyContent: 'center',

    paddingHorizontal: 14,

    backgroundColor:
      '#F8FAF9',

    borderLeftWidth: 1,
    borderLeftColor:
      '#EAECF0',
  },

  unitText: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },

  conversionPreview: {
    backgroundColor:
      '#F5F9F7',

    borderRadius: 12,

    borderWidth: 1,
    borderColor: '#E0EAE4',

    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  conversionLabel: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '600',

    marginBottom: 3,
  },

  conversionValue: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 13,
    fontWeight: '800',
  },

  noteSection: {
    gap: 7,
  },

  noteInput: {
    minHeight: 82,

    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,

    backgroundColor:
      '#FFFFFF',

    padding: 14,

    color: '#101828',

    fontSize: 14,
  },

  messageBox: {
    backgroundColor:
      '#FFF4ED',

    borderRadius: 12,

    padding: 11,
  },

  messageText: {
    color: '#B54708',
    fontSize: 12,
  },

  successBox: {
    backgroundColor:
      '#ECF8F2',

    borderRadius: 12,

    padding: 11,
  },

  successText: {
    color: '#137A53',

    fontSize: 12,
    fontWeight: '600',
  },

  recentHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  viewAll: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '700',
  },

  recentList: {
    backgroundColor:
      '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 18,

    overflow: 'hidden',
  },

  recentItem: {
    minHeight: 70,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,

    borderBottomWidth: 1,
    borderBottomColor:
      '#EEF2F0',
  },

  recentIcon: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor:
      '#EAF8F0',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  recentIconText: {
    color:
      VitalPilotColors.primaryDark,
    fontWeight: '900',
  },

  recentInfo: {
    flex: 1,
  },

  recentMetric: {
    color: '#344054',

    fontSize: 13,
    fontWeight: '700',
  },

  recentTime: {
    color: '#98A2B3',

    fontSize: 11,
    marginTop: 2,
  },

  recentValue: {
    color: '#101828',

    fontSize: 13,
    fontWeight: '800',
  },

  reminderCard: {
    backgroundColor:
      '#F6FBF8',

    borderWidth: 1,
    borderColor: '#DFEAE4',

    borderRadius: 16,

    padding: 15,
  },

  reminderTitle: {
    color: '#101828',

    fontSize: 13,
    fontWeight: '800',
  },

  reminderText: {
    color: '#667085',

    fontSize: 12,
    lineHeight: 18,

    marginTop: 4,
  },
});