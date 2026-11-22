import type { ReportPreviewData } from "@/services/api";

function isoDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function isoDateTime(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8, 15, 0, 0);
  return date.toISOString();
}

/** A realistic-looking but entirely made-up report, shaped exactly like a
 * real one (see backend/report_generator.py's build_report_data), so the
 * Reports tab's sample preview gives an honest idea of what "Generate
 * report" actually produces instead of a generic chart. */
export function buildSampleReportPreview(days: number): ReportPreviewData {
  return {
    period_label: `${days}-day`,
    start_date: isoDate(days),
    end_date: isoDate(0),
    patient: {
      name: "Jordan Avery",
      age: 34,
      sex: "Female",
      dob: "1992-03-14",
      height_in: 65,
      latest_weight_lbs: 142,
    },
    narrative: {
      hpi: `Jordan is a 34-year-old female who logged self-monitoring data over this ${days}-day period, tracking blood pressure, sleep duration, and water intake. Readings stayed within the normal range for most of the period, with one elevated blood pressure reading recorded partway through.`,
      summary: "Overall this was a stable period: sleep and hydration both met personal goals on most tracked days. One blood pressure reading briefly ran elevated but returned to a normal range on the following check-in. This is a sample report — your real summary will be written from your own logged data, not this example.",
    },
    previous_report: { start_date: isoDate(days * 2), end_date: isoDate(days) },
    metrics: [
      {
        metric_type: "BLOOD_PRESSURE", label: "Blood Pressure", unit: "mmHg", count: 5,
        fields: {
          systolic_mmhg: { min: 112, max: 134, avg: 121 },
          diastolic_mmhg: { min: 72, max: 86, avg: 79 },
        },
      },
      { metric_type: "BLOOD_GLUCOSE", label: "Blood Glucose", unit: "mg/dL", count: 0, fields: {} },
      { metric_type: "BLOOD_OXYGEN", label: "Blood Oxygen", unit: "%", count: 0, fields: {} },
      { metric_type: "PEAK_FLOW_RATE", label: "Peak Flow", unit: "L/min", count: 0, fields: {} },
      {
        metric_type: "PHYSICAL_ACTIVITY", label: "Steps", unit: "steps", count: 6,
        fields: { steps_taken: { min: 4200, max: 9800, avg: 7150 } },
      },
      {
        metric_type: "SLEEP", label: "Sleep", unit: "hours", count: 7,
        fields: { duration_hours: { min: 6, max: 8.5, avg: 7.3 } },
      },
      {
        metric_type: "WATER_INTAKE", label: "Water Intake", unit: "cups", count: 6,
        fields: { amount_cups: { min: 6, max: 10, avg: 8.2 } },
      },
      { metric_type: "BODY_MASS_INDEX", label: "Weight / BMI", unit: "lbs / BMI", count: 0, fields: {} },
    ],
    alerts: [
      {
        metric_type: "BLOOD_PRESSURE",
        classification: "Elevated Blood Pressure",
        recorded_at: isoDateTime(Math.max(1, Math.floor(days / 2))),
        severity: "WARNING",
      },
    ],
  };
}
