import type { SavedMetricReading, VitalType } from "../types/vitalpilot";
export type HistoryPeriod = 7 | 30 | 90;
export type FieldStats = { min: number; max: number; avg: number };
export type DailyBin = {
  date: string;
  count: number;
  values: Record<string, FieldStats>;
  contexts: Record<
    string,
    { count: number; values: Record<string, FieldStats> }
  >;
};
export type MetricHistoryData = {
  metric_type: VitalType;
  start_at: string;
  end_at: string;
  timezone_name: string;
  daily: DailyBin[];
  summary: {
    count: number;
    raw_count: number;
    days_logged: number;
    values: Record<string, FieldStats>;
  };
  latest: SavedMetricReading | null;
  records: SavedMetricReading[];
  offset: number;
  more: boolean;
};
export function historyPeriod(value?: string | string[]): HistoryPeriod {
  const days = Number(Array.isArray(value) ? value[0] : value);
  return days === 30 || days === 90 ? days : 7;
}
// Construct local midnights before converting to UTC; fixed 24-hour offsets fail
// across daylight-saving transitions.
export function historyWindow(days: HistoryPeriod, now = new Date()) {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - days + 1,
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return {
    start_at: start.toISOString(),
    today_start: today.toISOString(),
    end_at: end.toISOString(),
    timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
export function dayLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
export function chartSeries(bins: DailyBin[], field: string, context = "all") {
  return bins.map((bin) => {
    const group = context === "all" ? bin : bin.contexts[context];
    // Undefined is an intentional gap; zero remains a real recorded measurement.
    const stats = group?.values[field];
    return {
      date: bin.date,
      count: stats ? group.count : 0,
      value: stats?.avg,
      min: stats?.min,
      max: stats?.max,
    };
  });
}
