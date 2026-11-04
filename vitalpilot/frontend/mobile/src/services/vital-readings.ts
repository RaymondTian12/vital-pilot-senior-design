import { createReadingStore } from "./blood-pressure";
import type { OtherMetricReading, OtherVitalType, SavedMetricReading } from "../types/vitalpilot";
export const vitalFields = {
  BLOOD_GLUCOSE: "glucose_mgdl", BLOOD_OXYGEN: "spo2_percentage",
  PEAK_FLOW_RATE: "flow_rate_lmin", BODY_MASS_INDEX: "weight_lbs",
  SLEEP: "duration_hours", PHYSICAL_ACTIVITY: "steps_taken", WATER_INTAKE: "amount_cups",
} as const;
const limits: Record<OtherVitalType, { max: number; integer: boolean; zero: boolean }> = {
  BLOOD_GLUCOSE: {max: 2147483647, integer: true, zero: false},
  BLOOD_OXYGEN: {max: 100, integer: true, zero: false},
  PEAK_FLOW_RATE: {max: 2147483647, integer: true, zero: false},
  PHYSICAL_ACTIVITY: {max: 2147483647, integer: true, zero: true},
  BODY_MASS_INDEX: {max: 999.99, integer: false, zero: false},
  SLEEP: {max: 24, integer: false, zero: true},
  WATER_INTAKE: {max: 99.99, integer: false, zero: true},
};
export function vitalInput(type: OtherVitalType, text: string) {
  const rule = limits[type];
  const trimmed = text.trim();
  const valid = rule.integer ? /^\d+$/.test(trimmed) : /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(trimmed);
  const value = Number(trimmed);
  if (!valid || !Number.isFinite(value) || value < 0 || (!rule.zero && value === 0) || value > rule.max)
    throw new Error(`Enter ${rule.integer ? "a whole number" : "a number with up to two decimal places"} ${rule.zero ? "from 0" : "greater than 0"} and no greater than ${rule.max}.`);
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
      if (!/^\d+$/.test(text) || Number(text) <= 0 || Number(text) > 2147483647) throw new Error("Enter your personal best as a positive whole number in L/min.");
      values.peak_personal_best = Number(text);
    }
    return values;
  });
}
