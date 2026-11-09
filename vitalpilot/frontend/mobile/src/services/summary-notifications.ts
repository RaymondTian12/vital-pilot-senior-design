import type { DailySummaryResponse } from "./daily-summary";
import type { VitalNotification } from "../types/notification";
export function summaryNotifications(data: DailySummaryResponse): VitalNotification[] {
  const result = data.overall_result;
  if (!result) return [];
  const seen = new Set<string>();
  return ([...result.urgent_readings.map(r => ({ ...r, severity: "critical" as const })), ...result.warning_readings.map(r => ({ ...r, severity: "warning" as const }))]).filter(r => {
    const key = `${r.metric_type}:${r.log_id}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).map(r => ({ id: `reading:${r.metric_type}:${r.log_id}`, title: r.classification,
    message: `${r.metric_type.replaceAll("_", " ")} · ${new Date(r.recorded_at).toLocaleString()}. Open the saved reading for guidance.`,
    severity: r.severity, category: "health-alert", read: false, createdAt: r.recorded_at,
    action: { label: "Review reading", route: `/metric-history?metric=${r.metric_type}&log_id=${r.log_id}` },
  }));
}
