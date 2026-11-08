import { createReadingStore } from "./blood-pressure";
import type { OtherMetricReading, OtherVitalType, SavedMetricReading } from "../types/vitalpilot";
export const vitalFields = {
  BLOOD_GLUCOSE: "glucose_mgdl", BLOOD_OXYGEN: "spo2_percentage",
  PEAK_FLOW_RATE: "flow_rate_lmin", BODY_MASS_INDEX: "weight_lbs",
  SLEEP: "duration_hours", PHYSICAL_ACTIVITY: "steps_taken", WATER_INTAKE: "amount_cups",
} as const;
// Realistic physiological/device ranges, not just "any positive number" --
// e.g. peak flow meters top out well under a billion L/min.
const limits: Record<OtherVitalType, { min: number; max: number; integer: boolean }> = {
  BLOOD_GLUCOSE: {min: 20, max: 600, integer: true},
  BLOOD_OXYGEN: {min: 50, max: 100, integer: true},
  PEAK_FLOW_RATE: {min: 30, max: 900, integer: true},
  PHYSICAL_ACTIVITY: {min: 0, max: 200000, integer: true},
  BODY_MASS_INDEX: {min: 20, max: 999.99, integer: false},
  SLEEP: {min: 0, max: 24, integer: false},
  WATER_INTAKE: {min: 0, max: 99.99, integer: false},
};
export function vitalInput(type: OtherVitalType, text: string) {
  const rule = limits[type];
  const trimmed = text.trim();
  const valid = rule.integer ? /^\d+$/.test(trimmed) : /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(trimmed);
  const value = Number(trimmed);
  if (!valid || !Number.isFinite(value) || value < rule.min || value > rule.max)
    throw new Error(`Enter ${rule.integer ? "a whole number" : "a number with up to two decimal places"} from ${rule.min} to ${rule.max}.`);
  return { [vitalFields[type]]: value };
}
export function checkedVital(type: OtherVitalType, reading: OtherMetricReading) {
  const value = reading?.[vitalFields[type]];
  if (!reading || reading.metric_type !== type || !Number.isSafeInteger(reading.log_id) || reading.log_id <= 0 ||
      typeof reading.recorded_at !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(reading.recorded_at) || !Number.isFinite(Date.parse(reading.recorded_at)) ||
      typeof value !== "number" || !Number.isFinite(value)) throw new Error("Invalid metric response.");
  vitalInput(type, String(value));
  if (type === "BODY_MASS_INDEX" && (typeof reading.bmi_value !== "number" || !Number.isFinite(reading.bmi_value) || reading.bmi_value <= 0)) throw new Error("Invalid BMI response.");
  return reading;
}
export function readingValue(reading: SavedMetricReading) {
  return reading.metric_type === "BLOOD_PRESSURE"
    ? `${reading.systolic_mmhg}/${reading.diastolic_mmhg}`
    : String(reading[vitalFields[reading.metric_type]]);
}
type Client = {
  submitVital: (type: OtherVitalType, values: Record<string, number | string>) => Promise<OtherMetricReading>;
  getVital: (type: OtherVitalType, offset?: number) => Promise<{ count: number; records: OtherMetricReading[] }>;
};
export function createVitalStore(type: OtherVitalType, client: Client) {
  return createReadingStore({
    getPage: (offset) => client.getVital(type, offset),
    submit: (values: Record<string, number | string>) => client.submitVital(type, values),
  }, (reading) => checkedVital(type, reading), (primary, _secondary, context) => {
    const values: Record<string, number | string> = vitalInput(type, primary);
    if (type === "BLOOD_GLUCOSE") values.glucose_context = context?.glucose_context || "unknown";
    if (type === "PEAK_FLOW_RATE" && context?.peak_personal_best?.trim()) {
      const text = context.peak_personal_best.trim();
      if (!/^\d+$/.test(text) || Number(text) < 30 || Number(text) > 900) throw new Error("Enter your personal best as a whole number from 30 to 900 L/min.");
      values.peak_personal_best = Number(text);
    }
    return values;
  });
}
