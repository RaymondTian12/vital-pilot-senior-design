import type { BloodPressureReading, OtherMetricReading, VitalType } from "../types/vitalpilot";
import { classificationView } from "./blood-pressure";
import { vitalFields } from "./vital-readings";

export type SummaryReading = OtherMetricReading | (Omit<BloodPressureReading, "classification"> & { classification?: BloodPressureReading["classification"] });
export type OverallResult = {
  status: "urgent" | "needs_review" | "incomplete" | "no_alerts";
  title: string;
  message: string;
  urgent_readings: { metric_type: VitalType; log_id: number; recorded_at: string; classification: string }[];
  warning_readings: { metric_type: VitalType; log_id: number; recorded_at: string; classification: string }[];
  unclassified_readings: { metric_type: VitalType; log_id: number; recorded_at: string; classification: string }[];
  missing_health_metrics: VitalType[];
  habit_goals_met: number;
  habit_goals_below: number;
  habit_goals_unknown: number;
  logged_metric_count: number;
};
export type DailySummaryResponse = {
  overall_result?: OverallResult;
  records: SummaryReading[];
  goals: Partial<Record<VitalType, number>>;
  truncated_metrics: VitalType[];
  start_at: string;
  today_start: string;
  end_at: string;
};
export function summaryWindow(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start_at: start.toISOString(), today_start: today.toISOString(), end_at: end.toISOString() };
}
export function todayReadings(data: DailySummaryResponse) {
  const start = Date.parse(data.today_start), end = Date.parse(data.end_at);
  return data.records.filter((record) => {
    const time = Date.parse(record.recorded_at);
    return time >= start && time < end;
  }).sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at) || b.log_id - a.log_id);
}
export function summaryValue(reading: SummaryReading) {
  return reading.metric_type === "BLOOD_PRESSURE" ? `${reading.systolic_mmhg}/${reading.diastolic_mmhg}` : String(reading[vitalFields[reading.metric_type]]);
}
export function recentTrend(data: DailySummaryResponse, type: VitalType) {
  return data.records.filter((record) => record.metric_type === type)
    .sort((a, b) => Date.parse(a.recorded_at) - Date.parse(b.recorded_at) || a.log_id - b.log_id)
    .slice(-14).map((record) => record.metric_type === "BLOOD_PRESSURE" ? record.systolic_mmhg : Number(record[vitalFields[record.metric_type]]));
}
export function goalProgress(reading: SummaryReading | undefined, goal: number | undefined) {
  if (!reading || !goal || !Number.isFinite(goal) || goal <= 0 || reading.metric_type === "BLOOD_PRESSURE") return null;
  const value = Number(reading[vitalFields[reading.metric_type]]);
  return { value, goal, percent: Math.min(100, Math.max(0, value / goal * 100)), reached: value >= goal };
}
export function attentionReading(data: DailySummaryResponse): BloodPressureReading | undefined {
  const readings = todayReadings(data).filter((record): record is BloodPressureReading => record.metric_type === "BLOOD_PRESSURE" && !!record.classification);
  return readings.find((reading) => classificationView(reading).critical || reading.systolic_mmhg > 180 || reading.diastolic_mmhg > 120)
    ?? readings.find((reading) => classificationView(reading).tone === "warning")
    ?? readings.find((reading) => classificationView(reading).tone === "unknown");
}
