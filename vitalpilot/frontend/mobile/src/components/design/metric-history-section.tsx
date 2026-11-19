import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMetricHistory } from "@/hooks/use-metric-history";
import { type HistoryPeriod } from "@/services/metric-history";
import { readingValue, vitalFields } from "@/services/vital-readings";
import { classificationView } from "@/services/blood-pressure";
import type { SavedMetricReading } from "@/types/vitalpilot";
import { vitals, type Metric } from "./vitals-data";
import { ReadingResult } from "./blood-pressure-panel";
import { VitalReadingResult } from "./vital-history-panel";
import { MetricChart } from "./metric-chart";
import { Button, Card, Chip, ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const fmt = (value: number | undefined) =>
  value == null ? "—" : Number(value.toFixed(2)).toLocaleString();
export function PeriodControl({
  value,
  onChange,
}: {
  value: HistoryPeriod;
  onChange: (value: HistoryPeriod) => void;
}) {
  return (
    <View style={[ui.row, { gap: 8, flexWrap: "wrap" }]}>
      {([7, 30, 90] as const).map((days) => (
        <Chip
          key={days}
          selected={value === days}
          onPress={() => onChange(days)}
        >
          {days} days
        </Chip>
      ))}
    </View>
  );
}
export function MetricHistorySection({
  name,
  days,
}: {
  name: Metric;
  days: HistoryPeriod;
}) {
  const config = vitals[name];
  const { data, loading, loadingMore, error, refresh, loadMore } =
    useMetricHistory(config.type, days);
  const [bmi, setBmi] = useState(false);
  const habit = ["SLEEP", "WATER_INTAKE", "PHYSICAL_ACTIVITY"].includes(
    config.type,
  );
  const field =
    config.type === "BLOOD_PRESSURE"
      ? "systolic_mmhg"
      : config.type === "BODY_MASS_INDEX" && bmi
        ? "bmi_value"
        : vitalFields[config.type];
  const unit = config.type === "BODY_MASS_INDEX" && bmi ? "BMI" : config.unit;
  const stats = data?.summary.values[field];
  return (
    <View style={{ gap: 16 }}>
      {loading && (
        <Card>
          <Text accessibilityLiveRegion="polite" style={ui.body}>
            Loading {days} days of {name.toLowerCase()}…
          </Text>
        </Card>
      )}
      {!!error && (
        <Card>
          <Text accessibilityRole="alert" style={{ color: C.danger }}>
            {error}
          </Text>
          <Button secondary onPress={refresh}>
            Retry history
          </Button>
        </Card>
      )}
      {data && (
        <>
          <Card style={{ backgroundColor: C.mint, borderColor: C.mintStrong }}>
            <Text style={ui.eyebrow}>
              {name.toUpperCase()} · {days} DAYS
            </Text>
            <Text style={ui.title}>
              {data.latest
                ? bmi && data.latest.metric_type === "BODY_MASS_INDEX"
                  ? fmt(data.latest.bmi_value)
                  : readingValue(data.latest)
                : "—"}{" "}
              <Text style={ui.small}>{unit}</Text>
            </Text>
            <Text style={ui.small}>
              {data.latest
                ? `Latest · ${new Date(data.latest.recorded_at).toLocaleString()}`
                : "No saved readings in this period"}
            </Text>
            <View
              style={[
                ui.row,
                { justifyContent: "space-between", flexWrap: "wrap", gap: 14 },
              ]}
            >
              <View>
                <Text style={ui.small}>
                  {habit ? "Average / logged day" : "Average"}
                </Text>
                <Text style={ui.heading}>{fmt(stats?.avg)}</Text>
              </View>
              <View>
                <Text style={ui.small}>Range</Text>
                <Text style={ui.heading}>
                  {fmt(stats?.min)}–{fmt(stats?.max)}
                </Text>
              </View>
              <View>
                <Text style={ui.small}>
                  {habit ? "Days logged" : "Readings"}
                </Text>
                <Text style={ui.heading}>
                  {habit ? data.summary.days_logged : data.summary.count}
                </Text>
              </View>
            </View>
            {config.type === "BLOOD_PRESSURE" && (
              <Text style={ui.small}>
                Diastolic average {fmt(data.summary.values.diastolic_mmhg?.avg)}{" "}
                · range {fmt(data.summary.values.diastolic_mmhg?.min)}–
                {fmt(data.summary.values.diastolic_mmhg?.max)} mmHg
              </Text>
            )}
            <Text style={ui.small}>
              {data.daily[0]?.date} to {data.daily[data.daily.length - 1]?.date}{" "}
              · {data.summary.days_logged} of {data.daily.length} days logged.
              Missing days are excluded from averages.
            </Text>
            <Button secondary onPress={refresh}>
              Refresh readings
            </Button>
          </Card>
          {config.type === "BLOOD_GLUCOSE" && (
            <Text style={ui.small}>
              Overview statistics include all glucose contexts. The chart can
              filter fasting, nonfasting and unknown readings.
            </Text>
          )}
          {config.type === "BODY_MASS_INDEX" && (
            <View style={ui.row}>
              <Chip selected={!bmi} onPress={() => setBmi(false)}>
                Weight
              </Chip>
              <Chip selected={bmi} onPress={() => setBmi(true)}>
                BMI
              </Chip>
            </View>
          )}
          <Card>
            <Text accessibilityRole="header" style={ui.heading}>
              {name} over time
            </Text>
            <MetricChart
              key={`${config.type}:${days}:${field}`}
              data={data}
              field={field}
              unit={unit}
              habit={habit}
            />
          </Card>
          <Card>
            <Text accessibilityRole="header" style={ui.heading}>
              Saved readings
            </Text>
            <Text style={ui.small}>
              Newest first · tap a row for assessment and context. Daily
              averages above are descriptive, not classified readings.
            </Text>
            <View
              style={[
                ui.row,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                  paddingVertical: 10,
                },
              ]}
            >
              <Text style={[ui.eyebrow, { flex: 1 }]}>DATE / TIME</Text>
              <Text style={[ui.eyebrow, { flex: 1 }]}>VALUE</Text>
              <Text style={[ui.eyebrow, { flex: 1 }]}>STATUS</Text>
            </View>
            {!data.records.length && (
              <Text style={ui.body}>
                No readings yet. Log a measurement in Vitals to start your
                history.
              </Text>
            )}
            {data.records.map((reading) => (
              <ReadingRow
                key={reading.log_id}
                reading={reading}
                unit={config.unit}
                showActions={reading.log_id === data.latest?.log_id}
              />
            ))}
            {data.more && (
              <Button
                secondary
                disabled={loadingMore}
                onPress={() => void loadMore()}
              >
                {loadingMore ? "Loading…" : "Load more readings"}
              </Button>
            )}
          </Card>
        </>
      )}
    </View>
  );
}
function ReadingRow({
  reading,
  unit,
  showActions,
}: {
  reading: SavedMetricReading;
  unit: string;
  showActions: boolean;
}) {
  const { log_id } = useLocalSearchParams<{ log_id?: string }>();
  const [open, setOpen] = useState(String(reading.log_id) === log_id);
  const view =
    reading.metric_type === "BLOOD_PRESSURE"
      ? classificationView(reading)
      : null;
  const assessment =
    reading.metric_type !== "BLOOD_PRESSURE" ? reading.classification : null;
  const status = view?.title ?? assessment?.classification ?? "Unclassified";
  const color =
    view?.critical || assessment?.next_action === "urgent"
      ? C.danger
      : view?.tone === "normal" ||
          (assessment?.status === "classified" &&
            assessment.next_action === "none")
        ? C.primaryDark
        : C.warning;
  const date = new Date(reading.recorded_at);
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingVertical: 12,
        gap: 10,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={[ui.row, { alignItems: "flex-start", minHeight: 48, gap: 10 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={ui.small}>{date.toLocaleDateString()}</Text>
          <Text style={ui.small}>
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[ui.body, { fontWeight: "700" }]}>
            {readingValue(reading)}
          </Text>
          <Text style={ui.small}>{unit}</Text>
        </View>
        <Text style={[ui.small, { flex: 1, color, fontWeight: "700" }]}>
          {status} {open ? "▴" : "▾"}
        </Text>
      </Pressable>
      {open &&
        (reading.metric_type === "BLOOD_PRESSURE" ? (
          <ReadingResult reading={reading} showCare={showActions} />
        ) : (
          <VitalReadingResult reading={reading} unit={unit} showActions={showActions} />
        ))}
    </View>
  );
}
