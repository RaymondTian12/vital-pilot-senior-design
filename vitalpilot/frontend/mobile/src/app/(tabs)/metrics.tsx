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
import { useNotifications } from '@/context/notification-context';
import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';
import { api } from '@/services/api';

import type {
  MetricEvaluation,
} from '@/types/notification';

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

type MetricSubmitResponse = {
  success?: boolean;

  measurement?: {
    metric?: string;
    value?: string;
  };

  evaluation?: MetricEvaluation;
};

const metricTypes: {
  name: MetricType;
  icon: string;
  accent: string;
  background: string;
}[] = [
  {
    name: 'Blood Pressure',
    icon: '♥',
    accent: '#2E7EEA',
    background: '#EAF2FF',
  },
  {
    name: 'Blood Glucose',
    icon: '◈',
    accent: '#F79009',
    background: '#FFF4E5',
  },
  {
    name: 'Blood Oxygen',
    icon: '◉',
    accent: '#15945C',
    background: '#EAF8F0',
  },
  {
    name: 'Peak Flow',
    icon: '⌁',
    accent: '#12B0A0',
    background: '#E8F8F6',
  },
  {
    name: 'Sleep',
    icon: '☾',
    accent: '#8752D4',
    background: '#F1EBFC',
  },
  {
    name: 'Physical Activity',
    icon: '↗',
    accent: '#15945C',
    background: '#EAF8F0',
  },
  {
    name: 'Water Intake',
    icon: '◒',
    accent: '#2E90FA',
    background: '#EAF4FF',
  },
  {
    name: 'Weight',
    icon: '▣',
    accent: '#5D6BD8',
    background: '#EEF0FF',
  },
];

const initialRecentMeasurements: RecentMeasurement[] = [
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
  const {
    addMetricEvaluation,
  } = useNotifications();

  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>('Blood Pressure');

  const [primaryValue, setPrimaryValue] =
    useState('');

  const [secondaryValue, setSecondaryValue] =
    useState('');

  const [note, setNote] =
    useState('');

  const [weightUnit, setWeightUnit] =
    useState<WeightUnit>('kg');

  const [waterUnit, setWaterUnit] =
    useState<WaterUnit>('mL');

  const [message, setMessage] =
    useState('');

  const [messageType, setMessageType] =
    useState<
      'success' | 'error' | ''
    >('');

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    recentMeasurements,
    setRecentMeasurements,
  ] = useState<RecentMeasurement[]>(
    initialRecentMeasurements
  );

  const selectedMetricStyle =
    useMemo(() => {
      return (
        metricTypes.find(
          (metric) =>
            metric.name ===
            selectedMetric
        ) ?? metricTypes[0]
      );
    }, [selectedMetric]);

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
          primaryLabel:
            'Blood Glucose',
          primaryPlaceholder: '102',
          primaryUnit: 'mg/dL',
        };

      case 'Blood Oxygen':
        return {
          primaryLabel:
            'Blood Oxygen',
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
          primaryLabel:
            'Activity Duration',
          primaryPlaceholder: '30',
          primaryUnit: 'min',
        };

      case 'Water Intake':
        return {
          primaryLabel:
            'Water Intake',

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
    setMessageType('');
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

    if (
      Number.isNaN(primaryNumber)
    ) {
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

      if (
        Number.isNaN(diastolic)
      ) {
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
      selectedMetric ===
        'Weight' &&
      weightUnit === 'kg' &&
      primaryNumber > 500
    ) {
      return 'Please check the weight value.';
    }

    if (
      selectedMetric ===
        'Weight' &&
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

  function buildDisplayValue() {
    if (
      selectedMetric ===
      'Blood Pressure'
    ) {
      return `${primaryValue.trim()}/${secondaryValue.trim()} mmHg`;
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
      return `${primaryValue.trim()} ${weightUnit}`;
    }

    if (
      selectedMetric ===
      'Water Intake'
    ) {
      return `${primaryValue.trim()} ${waterUnit}`;
    }

    return `${primaryValue.trim()} ${metricConfig.primaryUnit}`;
  }

  function addToRecentMeasurements(
    value: string
  ) {
    const measurement: RecentMeasurement =
      {
        id: `measurement-${Date.now()}`,

        metric: selectedMetric,

        value,

        time: 'Just now',
      };

    setRecentMeasurements(
      (current) => [
        measurement,
        ...current,
      ]
    );
  }

  async function saveMeasurement() {
    const validationError =
      validateMeasurement();

    if (validationError) {
      setMessage(
        validationError
      );

      setMessageType('error');

      return;
    }

    setMessage('');
    setMessageType('');

    setIsSaving(true);

    const measurementValue =
      buildMeasurementValue();

    const displayValue =
      buildDisplayValue();

    try {
      let evaluation:
        MetricEvaluation = {
          severity: 'normal',
        };

      /*
       * When the backend is connected,
       * Health Analytics should return
       * the evaluation.
       *
       * The React Native frontend should
       * NOT contain permanent clinical
       * threshold rules.
       */
      if (
        process.env
          .EXPO_PUBLIC_API_BASE_URL
      ) {
        const response =
          (await api.submitMetric(
            selectedMetric,
            measurementValue
          )) as MetricSubmitResponse;

        if (response?.evaluation) {
          evaluation =
            response.evaluation;
        }
      }

      /*
       * Send the evaluation to the
       * Notification & Reporting UI.
       *
       * normal   -> success notification
       * warning  -> orange warning banner
       * critical -> critical modal
       */
      addMetricEvaluation(
        selectedMetric,
        displayValue,
        evaluation
      );

      addToRecentMeasurements(
        displayValue
      );

      if (
        evaluation.severity ===
        'critical'
      ) {
        setMessage(
          'Measurement recorded. A critical health alert was generated.'
        );

        setMessageType('error');
      } else if (
        evaluation.severity ===
        'warning'
      ) {
        setMessage(
          'Measurement recorded. Please review the health notification.'
        );

        setMessageType('error');
      } else {
        setMessage(
          'Measurement saved successfully.'
        );

        setMessageType(
          'success'
        );
      }

      setPrimaryValue('');
      setSecondaryValue('');
      setNote('');
    } catch {
      setMessage(
        'Unable to save the measurement right now.'
      );

      setMessageType('error');
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
        style={
          styles.keyboardView
        }
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
          {/* Header */}
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

          {/* Safety information */}
          <View style={styles.safetyCard}>
            <View
              style={
                styles.safetyIcon
              }
            >
              <Text
                style={
                  styles.safetyIconText
                }
              >
                i
              </Text>
            </View>

            <View
              style={
                styles.safetyContent
              }
            >
              <Text
                style={
                  styles.safetyTitle
                }
              >
                Health monitoring
              </Text>

              <Text
                style={
                  styles.safetyText
                }
              >
                After a measurement is
                submitted, VitalPilot's
                Health Analytics service
                can evaluate the result and
                send normal, warning, or
                critical notifications.
              </Text>
            </View>
          </View>

          <Text
            style={styles.sectionTitle}
          >
            What would you like to
            record?
          </Text>

          {/* Metric selector */}
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
                    style={[
                      selected
                        ? styles.metricChoiceSelected
                        : styles.metricChoice,

                      selected && {
                        borderColor:
                          metric.accent,

                        backgroundColor:
                          metric.background,
                      },
                    ]}
                  >
                    <View
                      style={[
                        selected
                          ? styles.metricIconSelected
                          : styles.metricIcon,

                        {
                          backgroundColor:
                            metric.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          selected
                            ? styles.metricIconTextSelected
                            : styles.metricIconText,

                          {
                            color:
                              metric.accent,
                          },
                        ]}
                      >
                        {metric.icon}
                      </Text>
                    </View>

                    <Text
                      style={[
                        selected
                          ? styles.metricChoiceTextSelected
                          : styles.metricChoiceText,

                        selected && {
                          color:
                            metric.accent,
                        },
                      ]}
                    >
                      {metric.name}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          {/* Entry card */}
          <VitalCard
            style={styles.entryCard}
          >
            <View
              style={
                styles.entryHeader
              }
            >
              <View
                style={
                  styles.entryHeaderLeft
                }
              >
                <View
                  style={[
                    styles.entryMetricIcon,
                    {
                      backgroundColor:
                        selectedMetricStyle.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.entryMetricIconText,
                      {
                        color:
                          selectedMetricStyle.accent,
                      },
                    ]}
                  >
                    {
                      selectedMetricStyle.icon
                    }
                  </Text>
                </View>

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

            {/* Weight Unit */}
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
                    onPress={() => {
                      setWeightUnit(
                        'kg'
                      );

                      setPrimaryValue(
                        ''
                      );
                    }}
                  />

                  <UnitButton
                    label="lb"
                    selected={
                      weightUnit ===
                      'lb'
                    }
                    onPress={() => {
                      setWeightUnit(
                        'lb'
                      );

                      setPrimaryValue(
                        ''
                      );
                    }}
                  />
                </View>
              </View>
            ) : null}

            {/* Water Unit */}
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
                    onPress={() => {
                      setWaterUnit(
                        'mL'
                      );

                      setPrimaryValue(
                        ''
                      );
                    }}
                  />

                  <UnitButton
                    label="oz"
                    selected={
                      waterUnit ===
                      'oz'
                    }
                    onPress={() => {
                      setWaterUnit(
                        'oz'
                      );

                      setPrimaryValue(
                        ''
                      );
                    }}
                  />
                </View>
              </View>
            ) : null}

            {/* Primary Measurement */}
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

            {/* Secondary Measurement */}
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

            {/* Weight Conversion */}
            {selectedMetric ===
              'Weight' &&
            primaryValue.trim() ? (
              <WeightConversionPreview
                value={primaryValue}
                unit={weightUnit}
              />
            ) : null}

            {/* Water Conversion */}
            {selectedMetric ===
              'Water Intake' &&
            primaryValue.trim() ? (
              <WaterConversionPreview
                value={primaryValue}
                unit={waterUnit}
              />
            ) : null}

            {/* Notes */}
            <View
              style={
                styles.noteSection
              }
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

            {/* Validation / Save message */}
            {message ? (
              <View
                style={
                  messageType ===
                  'success'
                    ? styles.successBox
                    : styles.messageBox
                }
              >
                <Text
                  style={
                    messageType ===
                    'success'
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

          {/* Analytics explanation */}
          <View
            style={
              styles.analyticsCard
            }
          >
            <View
              style={
                styles.analyticsHeader
              }
            >
              <View
                style={
                  styles.analyticsIcon
                }
              >
                <Text
                  style={
                    styles.analyticsIconText
                  }
                >
                  ✓
                </Text>
              </View>

              <View
                style={
                  styles.analyticsContent
                }
              >
                <Text
                  style={
                    styles.analyticsTitle
                  }
                >
                  Automatic health analysis
                </Text>

                <Text
                  style={
                    styles.analyticsText
                  }
                >
                  Submitted measurements
                  can be evaluated by the
                  VitalPilot Health Analytics
                  layer. If attention is
                  required, an alert appears
                  and is added to your
                  Notification Center.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.severityRow
              }
            >
              <SeverityItem
                color="#15945C"
                background="#EAF8F0"
                label="Normal"
              />

              <SeverityItem
                color="#F79009"
                background="#FFF4E5"
                label="Warning"
              />

              <SeverityItem
                color="#D92D20"
                background="#FEF3F2"
                label="Critical"
              />
            </View>
          </View>

          {/* Recent */}
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

            <Text
              style={
                styles.recentCount
              }
            >
              {
                recentMeasurements.length
              }{' '}
              logged
            </Text>
          </View>

          <View
            style={styles.recentList}
          >
            {recentMeasurements
              .slice(0, 6)
              .map(
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

          {/* Accuracy reminder */}
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

          {/* Emergency disclaimer */}
          <View
            style={
              styles.emergencyDisclaimer
            }
          >
            <Text
              style={
                styles.emergencyDisclaimerTitle
              }
            >
              Medical emergency?
            </Text>

            <Text
              style={
                styles.emergencyDisclaimerText
              }
            >
              VitalPilot is a health
              monitoring tool and is not
              an emergency service. If you
              believe you are experiencing
              a medical emergency, seek
              immediate medical assistance
              or contact emergency services.
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
      numericValue /
      29.5735;

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
    numericValue *
    29.5735;

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

function SeverityItem({
  color,
  background,
  label,
}: {
  color: string;
  background: string;
  label: string;
}) {
  return (
    <View
      style={[
        styles.severityItem,
        {
          backgroundColor:
            background,
        },
      ]}
    >
      <View
        style={[
          styles.severityDot,
          {
            backgroundColor:
              color,
          },
        ]}
      />

      <Text
        style={[
          styles.severityLabel,
          {
            color,
          },
        ]}
      >
        {label}
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

  /*
   * Safety
   */

  safetyCard: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    backgroundColor: '#EFF4FF',

    borderWidth: 1,
    borderColor: '#D1E0FF',

    borderRadius: 16,

    padding: 13,

    gap: 10,
  },

  safetyIcon: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: '#DCE6FF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  safetyIconText: {
    color: '#175CD3',

    fontSize: 14,
    fontWeight: '900',
  },

  safetyContent: {
    flex: 1,
  },

  safetyTitle: {
    color: '#1849A9',

    fontSize: 12,
    fontWeight: '800',
  },

  safetyText: {
    color: '#475467',

    fontSize: 10,
    lineHeight: 16,

    marginTop: 3,
  },

  /*
   * Metric selector
   */

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

    borderWidth: 1.5,

    borderRadius: 16,

    padding: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  metricIcon: {
    width: 36,
    height: 36,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 7,
  },

  metricIconSelected: {
    width: 36,
    height: 36,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 7,
  },

  metricIconText: {
    fontSize: 17,
  },

  metricIconTextSelected: {
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
    fontSize: 12,
    fontWeight: '800',

    textAlign: 'center',
  },

  /*
   * Entry
   */

  entryCard: {
    gap: 17,
  },

  entryHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    gap: 10,
  },

  entryHeaderLeft: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,
  },

  entryMetricIcon: {
    width: 42,
    height: 42,

    borderRadius: 21,

    alignItems: 'center',
    justifyContent: 'center',
  },

  entryMetricIconText: {
    fontSize: 18,
    fontWeight: '900',
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

  /*
   * Units
   */

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

  /*
   * Measurement input
   */

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

  /*
   * Conversion
   */

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

  /*
   * Notes
   */

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

  /*
   * Messages
   */

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

  /*
   * Analytics
   */

  analyticsCard: {
    backgroundColor:
      '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 18,

    padding: 15,

    gap: 14,
  },

  analyticsHeader: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 11,
  },

  analyticsIcon: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor:
      '#EAF8F0',

    alignItems: 'center',
    justifyContent: 'center',
  },

  analyticsIconText: {
    color: '#137A53',

    fontSize: 15,
    fontWeight: '900',
  },

  analyticsContent: {
    flex: 1,
  },

  analyticsTitle: {
    color: '#101828',

    fontSize: 13,
    fontWeight: '800',
  },

  analyticsText: {
    color: '#667085',

    fontSize: 10,
    lineHeight: 16,

    marginTop: 4,
  },

  severityRow: {
    flexDirection: 'row',

    gap: 7,
  },

  severityItem: {
    flex: 1,

    minHeight: 36,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,

    paddingHorizontal: 6,
  },

  severityDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    marginRight: 5,
  },

  severityLabel: {
    fontSize: 9,
    fontWeight: '800',
  },

  /*
   * Recent
   */

  recentHeader: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',
  },

  recentCount: {
    color: '#98A2B3',

    fontSize: 10,
    fontWeight: '600',
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

  /*
   * Reminder
   */

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

  /*
   * Emergency disclaimer
   */

  emergencyDisclaimer: {
    backgroundColor:
      '#FFF8EB',

    borderWidth: 1,
    borderColor: '#FEDF89',

    borderRadius: 16,

    padding: 14,
  },

  emergencyDisclaimerTitle: {
    color: '#B54708',

    fontSize: 12,
    fontWeight: '900',
  },

  emergencyDisclaimerText: {
    color: '#7A2E0E',

    fontSize: 10,
    lineHeight: 16,

    marginTop: 4,
  },
});