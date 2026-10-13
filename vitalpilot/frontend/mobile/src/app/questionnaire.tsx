import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import type { QuestionnaireRequest, VitalType } from "@/types/vitalpilot";
import {
  Button,
  Card,
  Chip,
  Field,
  Heading,
  Notice,
  Orbit,
  Screen,
  ui,
} from "@/components/design/ui";
import { DateField } from "@/components/design/date-field";
import {
  normalizeMeasurements,
  type HeightUnit,
  type WeightUnit,
} from "@/services/measurements";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const metricTypes: Record<string, VitalType> = {
  "Blood Pressure": "BLOOD_PRESSURE",
  "Blood Glucose": "BLOOD_GLUCOSE",
  "Blood Oxygen": "BLOOD_OXYGEN",
  "Peak Flow": "PEAK_FLOW_RATE",
  Sleep: "SLEEP",
  "Physical Activity": "PHYSICAL_ACTIVITY",
  "Water Intake": "WATER_INTAKE",
  Weight: "BODY_MASS_INDEX",
};
const metrics = Object.keys(metricTypes);
const goalFields = [
  {
    metric: "Physical Activity",
    field: "steps_goal",
    label: "Daily steps",
    integer: true,
  },
  {
    metric: "Water Intake",
    field: "water_goal",
    label: "Daily water (cups)",
    integer: false,
  },
  {
    metric: "Sleep",
    field: "sleep_goal",
    label: "Daily sleep (hours)",
    integer: false,
  },
  {
    metric: "Peak Flow",
    field: "peak_flow_goal",
    label: "Personal best peak flow (L/min)",
    integer: true,
  },
] as const;

export default function QuestionnaireScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [gender, setGender] = useState<"male" | "female">("female");
  const [dob, setDob] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("ft");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [metricHeight, setMetricHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goals, setGoals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "Blood Pressure",
    "Blood Glucose",
  ]);

  const [error, setError] = useState("");

  function toggleMetric(metric: string) {
    setSelectedMetrics((currentMetrics) => {
      if (currentMetrics.includes(metric)) {
        return currentMetrics.filter(
          (currentMetric) => currentMetric !== metric,
        );
      }

      return [...currentMetrics, metric];
    });
  }

  function goToMetricSelection() {
    const parsedDate = new Date(`${dob}T00:00:00Z`);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
      !Number.isFinite(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== dob ||
      dob > today
    ) {
      setError("Choose a valid birth date, no later than today.");
      return;
    }
    try {
      normalizeMeasurements(
        heightUnit,
        feet,
        inches,
        metricHeight,
        weightUnit,
        weight,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your measurements.");
      return;
    }

    setError("");
    setStep(2);
  }

  function goToGoals() {
    if (selectedMetrics.length === 0) {
      setError("Please select at least one health metric.");
      return;
    }

    setError("");
    setStep(3);
  }

  async function finishSetup() {
    if (saving) return;
    const payload: QuestionnaireRequest = {
      gender,
      dob,
      ...normalizeMeasurements(
        heightUnit,
        feet,
        inches,
        metricHeight,
        weightUnit,
        weight,
      ),
      selectedVitals: selectedMetrics.map((metric) => metricTypes[metric]),
    };
    for (const goal of goalFields.filter((goal) =>
      selectedMetrics.includes(goal.metric),
    )) {
      const value = Number(goals[goal.field]);
      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        (goal.integer && !Number.isInteger(value)) ||
        (goal.field === "sleep_goal" && value > 24)
      ) {
        setError(
          `Enter a valid positive value for ${goal.label.toLowerCase()}.`,
        );
        return;
      }
      payload[goal.field] = value;
    }
    setSaving(true);
    setError("");
    try {
      await api.saveQuestionnaire(payload);
      router.replace("/home");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save questionnaire. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen back>
      <View style={[ui.row, { justifyContent: "space-between" }]}>
        {["About you", "Metrics", "Goals"].map((title, i) => (
          <View key={title} style={{ flex: 1, gap: 9 }}>
            <View
              style={{
                height: 4,
                marginRight: 8,
                borderRadius: 4,
                backgroundColor: step >= i + 1 ? C.primary : C.border,
              }}
            />
            <Text
              style={[
                ui.small,
                { color: step === i + 1 ? C.primaryDark : C.textSecondary },
              ]}
            >
              {i + 1}. {title}
            </Text>
          </View>
        ))}
      </View>
      <Heading
        title={
          step === 1
            ? "A little about you"
            : step === 2
              ? "Track what matters"
              : "Your goals, your pace"
        }
        subtitle={
          step === 1
            ? "Your baseline helps put readings in context."
            : step === 2
              ? "Choose at least one metric you want to monitor."
              : "Set a target for each selected daily habit."
        }
      />
      {step === 1 && (
        <>
          <Orbit size={110} icon="person" />
          <Card>
            <Text style={ui.body}>Sex</Text>
            <View style={ui.row}>
              {(["female", "male"] as const).map((value) => (
                <Chip
                  key={value}
                  selected={gender === value}
                  onPress={() => setGender(value)}
                >
                  {value === "female" ? "Female" : "Male"}
                </Chip>
              ))}
            </View>
            <DateField value={dob} onChange={setDob} />
            <Text style={ui.body}>Height</Text>
            <View style={[ui.row, { flexWrap: "wrap" }]}>
              {(["ft", "cm", "m"] as const).map((unit) => (
                <Chip
                  key={unit}
                  selected={heightUnit === unit}
                  onPress={() => {
                    if (unit !== heightUnit) {
                      const total =
                        heightUnit === "ft"
                          ? Number(feet) * 12 + Number(inches)
                          : (Number(metricHeight) *
                              (heightUnit === "m" ? 100 : 1)) /
                            2.54;
                      if (Number.isFinite(total) && total > 0) {
                        if (unit === "ft") {
                          const rounded = Math.round(total);
                          setFeet(String(Math.floor(rounded / 12)));
                          setInches(String(rounded % 12));
                        } else
                          setMetricHeight(
                            String(
                              Math.round(
                                total * 2.54 * (unit === "m" ? 0.01 : 1) * 100,
                              ) / 100,
                            ),
                          );
                      }
                      setHeightUnit(unit);
                    }
                    setError("");
                  }}
                >
                  {unit === "ft"
                    ? "Feet & inches"
                    : unit === "cm"
                      ? "Centimeters"
                      : "Meters"}
                </Chip>
              ))}
            </View>
            {heightUnit === "ft" ? (
              <View style={ui.row}>
                <Field
                  label="Height (feet)"
                  value={feet}
                  onChangeText={setFeet}
                  placeholder="Feet"
                  keyboardType="number-pad"
                />
                <Field
                  label="Inches (0–11)"
                  value={inches}
                  onChangeText={setInches}
                  placeholder="Inches"
                  keyboardType="number-pad"
                />
              </View>
            ) : (
              <Field
                label={heightUnit === "cm" ? "Height (cm)" : "Height (m)"}
                value={metricHeight}
                onChangeText={setMetricHeight}
                keyboardType="decimal-pad"
                placeholder={heightUnit === "cm" ? "e.g. 170" : "e.g. 1.70"}
              />
            )}
            {heightUnit !== "ft" && (
              <Text style={ui.small}>
                Converted to the nearest inch when saved.
              </Text>
            )}
            <Text style={ui.body}>Weight</Text>
            <View style={ui.row}>
              {(["lb", "kg"] as const).map((unit) => (
                <Chip
                  key={unit}
                  selected={weightUnit === unit}
                  onPress={() => {
                    if (
                      unit !== weightUnit &&
                      weight.trim() &&
                      Number.isFinite(Number(weight))
                    )
                      setWeight(
                        String(
                          Math.round(
                            (unit === "kg"
                              ? Number(weight) * 0.45359237
                              : Number(weight) / 0.45359237) * 100,
                          ) / 100,
                        ),
                      );
                    setWeightUnit(unit);
                  }}
                >
                  {unit === "lb" ? "Pounds (lb)" : "Kilograms (kg)"}
                </Chip>
              ))}
            </View>
            <Field
              label={`Weight (${weightUnit})`}
              value={weight}
              onChangeText={setWeight}
              placeholder={
                weightUnit === "lb" ? "Weight in pounds" : "Weight in kilograms"
              }
              keyboardType="decimal-pad"
            />
          </Card>
        </>
      )}
      {step === 2 && (
        <View style={[ui.row, { flexWrap: "wrap" }]}>
          {metrics.map((metric) => (
            <Chip
              key={metric}
              selected={selectedMetrics.includes(metric)}
              onPress={() => toggleMetric(metric)}
            >
              {metric}
            </Chip>
          ))}
        </View>
      )}
      {step === 3 && (
        <>
          <Card>
            {goalFields
              .filter((goal) => selectedMetrics.includes(goal.metric))
              .map((goal) => (
                <Field
                  key={goal.field}
                  label={goal.label}
                  value={goals[goal.field] ?? ""}
                  onChangeText={(value) =>
                    setGoals((current) => ({ ...current, [goal.field]: value }))
                  }
                  keyboardType={goal.integer ? "number-pad" : "decimal-pad"}
                  placeholder={goal.label}
                />
              ))}
            {!goalFields.some((goal) =>
              selectedMetrics.includes(goal.metric),
            ) && (
              <Text style={ui.subtitle}>
                Your selected metrics do not need a daily goal. You’re ready to
                finish setup.
              </Text>
            )}
          </Card>
          <Card>
            <Text style={ui.heading}>Selected metrics</Text>
            <Text style={ui.subtitle}>{selectedMetrics.join(", ")}</Text>
          </Card>
        </>
      )}
      {error ? <Notice error>{error}</Notice> : null}
      <Button
        loading={saving}
        onPress={
          step === 1
            ? goToMetricSelection
            : step === 2
              ? goToGoals
              : finishSetup
        }
        icon="arrow"
      >
        {step === 3 ? "Finish setup" : "Continue"}
      </Button>
      {step > 1 && (
        <Button
          secondary
          disabled={saving}
          onPress={() => {
            setError("");
            setStep(step - 1);
          }}
        >
          Previous step
        </Button>
      )}
      {step < 3 && (
        <Text style={ui.small}>
          Next: {step === 1 ? "choose your metrics" : "set your goals"}
        </Text>
      )}
    </Screen>
  );
}
