import type { IconName } from "./icon";
import type { VitalType } from "@/types/vitalpilot";

type MetricConfig = {
  type: VitalType;
  unit: string;
  icon: IconName;
  primary: string;
  secondary?: string;
  integer: boolean;
  hint: string;
  sample: string;
  history: string[];
  trend: number[];
  secondaryTrend?: number[];
};

export const vitals = {
  "Blood Pressure": {
    type: "BLOOD_PRESSURE",
    unit: "mmHg",
    icon: "vitals",
    primary: "Systolic / top number",
    secondary: "Diastolic / bottom number",
    integer: true,
    hint: "Enter the two numbers shown on your blood pressure monitor.",
    sample: "120/80",
    history: ["120/80", "122/79", "118/76"],
    trend: [118, 122, 116, 124, 120],
    secondaryTrend: [76, 79, 75, 82, 80],
  },
  "Blood Glucose": {
    type: "BLOOD_GLUCOSE",
    unit: "mg/dL",
    icon: "water",
    primary: "Glucose",
    integer: true,
    hint: "Enter the value shown on your glucose meter.",
    sample: "98",
    history: ["98", "102", "94"],
    trend: [94, 102, 98, 96, 98],
  },
  "Blood Oxygen": {
    type: "BLOOD_OXYGEN",
    unit: "%",
    icon: "heart",
    primary: "Oxygen saturation",
    integer: true,
    hint: "Enter the oxygen saturation shown on your pulse oximeter.",
    sample: "98",
    history: ["98", "97", "98"],
    trend: [97, 98, 97, 99, 98],
  },
  "Peak Flow": {
    type: "PEAK_FLOW_RATE",
    unit: "L/min",
    icon: "lungs",
    primary: "Peak flow",
    integer: true,
    hint: "Enter the reading shown on your peak flow meter.",
    sample: "450",
    history: ["450", "440", "460"],
    trend: [430, 450, 440, 460, 450],
  },
  Weight: {
    type: "BODY_MASS_INDEX",
    unit: "lb",
    icon: "scale",
    primary: "Weight",
    integer: false,
    hint: "Enter your latest weight in pounds.",
    sample: "150",
    history: ["150", "150.5", "151"],
    trend: [151, 150.5, 151, 150.5, 150],
  },
  Sleep: {
    type: "SLEEP",
    unit: "hours",
    icon: "moon",
    primary: "Sleep duration",
    integer: false,
    hint: "Enter the number of hours you slept.",
    sample: "7.5",
    history: ["7.5", "8", "7"],
    trend: [7, 7.5, 8, 7, 7.5],
  },
  "Physical Activity": {
    type: "PHYSICAL_ACTIVITY",
    unit: "steps",
    icon: "activity",
    primary: "Steps",
    integer: true,
    hint: "Enter your step count from your phone or activity tracker.",
    sample: "6,200",
    history: ["6,200", "5,800", "6,400"],
    trend: [5200, 6400, 5800, 6100, 6200],
  },
  "Water Intake": {
    type: "WATER_INTAKE",
    unit: "cups",
    icon: "water",
    primary: "Water",
    integer: false,
    hint: "Enter the number of cups of water you drank.",
    sample: "5",
    history: ["5", "6", "4.5"],
    trend: [4.5, 5, 6, 4, 5],
  },
} satisfies Record<string, MetricConfig>;

export type Metric = keyof typeof vitals;
export type Draft = { primary: string; secondary: string };
export const emptyDraft: Draft = { primary: "", secondary: "" };
export const healthMetrics: Metric[] = [
  "Blood Pressure",
  "Blood Glucose",
  "Blood Oxygen",
  "Peak Flow",
  "Weight",
];
export const habitMetrics: Metric[] = [
  "Sleep",
  "Physical Activity",
  "Water Intake",
];
export function isMetric(value: unknown): value is Metric {
  return typeof value === "string" && Object.hasOwn(vitals, value);
}
export function metricConfig(metric: Metric): MetricConfig {
  return vitals[metric];
}
