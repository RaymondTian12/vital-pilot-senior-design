import { useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import {
  chartSeries,
  dayLabel,
  type MetricHistoryData,
} from "@/services/metric-history";
import { useMotionPreference } from "./motion";
import { Button, Chip, ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const fmt = (value: number | undefined) =>
  value == null ? "—" : Number(value.toFixed(2)).toLocaleString();
export function MetricChart({
  data,
  field,
  unit,
  habit,
}: {
  data: MetricHistoryData;
  field: string;
  unit: string;
  habit: boolean;
}) {
  const [context, setContext] = useState("all"),
    [selected, setSelected] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const reduced = useMotionPreference();
  const series = chartSeries(data.daily, field, context);
  const second =
    data.metric_type === "BLOOD_PRESSURE"
      ? chartSeries(data.daily, "diastolic_mmhg")
      : null;
  const chartWidth = Math.max(180, Math.min(width, 640) - 116);
  const step = Math.max(chartWidth / Math.min(7, series.length), 28);
  const labelEvery = series.length <= 7 ? 1 : 5;
  const label = (index: number) =>
    index % labelEvery === 0 || index === series.length - 1
      ? dayLabel(series[index].date)
      : "";
  const points = series.map((point, index) => ({
    value: point.value,
    label: label(index),
    onPress: () => setSelected(index),
    hideDataPoint: point.value == null,
  }));
  let Charts: typeof import("react-native-gifted-charts") | null = null;
  try {
    Charts = require("react-native-gifted-charts");
  } catch {
    /* An older native build can still use the table. */
  }
  const chosen = selected == null ? null : series[selected];
  const shown = series.filter((point) => point.value != null);
  return (
    <View style={{ gap: 14 }}>
      {data.metric_type === "BLOOD_GLUCOSE" && (
        <View style={[ui.row, { flexWrap: "wrap", gap: 8 }]}>
          {[
            ["all", "All contexts"],
            ["fasting", "Fasting"],
            ["nonfasting", "Nonfasting"],
            ["unknown", "Unknown"],
          ].map(([value, title]) => (
            <Chip
              key={value}
              selected={context === value}
              onPress={() => {
                setContext(value);
                setSelected(null);
              }}
            >
              {title}
            </Chip>
          ))}
        </View>
      )}
      <Text style={ui.small}>
        {habit
          ? "Latest total per local day"
          : "Daily averages · tap a point for its range"}{" "}
        · {unit}
      </Text>
      {second && (
        <Text style={ui.small}>● Systolic (teal) ● Diastolic (blue)</Text>
      )}
      {!shown.length ? (
        <Text style={ui.body}>No readings for this selection.</Text>
      ) : !Charts ? (
        <Text style={ui.body}>
          Rebuild the development app to display the new charts. Readings remain
          available below.
        </Text>
      ) : (
        <View style={{ overflow: "hidden", paddingTop: 8 }}>
          {habit ? (
            <Charts.BarChart
              // useMotionPreference() defaults to `true` then flips to the real
              // value shortly after mount, changing isAnimated in place -- which
              // makes gifted-charts reset already-drawn bars instead of smoothly
              // transitioning. Remount cleanly instead of reacting to that flip.
              key={`bar-${reduced}`}
              data={series.map((point, index) => ({
                value: point.value ?? 0,
                label: label(index),
                frontColor: point.value == null ? "transparent" : C.primary,
                onPress: () => setSelected(index),
                minHeight: point.value === 0 ? 2 : 0,
              }))}
              width={chartWidth}
              height={190}
              spacing={12}
              barWidth={Math.max(16, step - 12)}
              barBorderTopLeftRadius={5}
              barBorderTopRightRadius={5}
              noOfSections={4}
              yAxisLabelWidth={44}
              rulesColor={C.border}
              xAxisColor={C.border}
              yAxisColor="transparent"
              xAxisLabelTextStyle={{ fontSize: 10, color: C.textSecondary }}
              yAxisTextStyle={{ fontSize: 10, color: C.textSecondary }}
              isAnimated={!reduced}
            />
          ) : (
            <Charts.LineChart
              key={`line-${reduced}`}
              data={points}
              data2={second?.map((point, index) => ({
                value: point.value,
                label: label(index),
                onPress: () => setSelected(index),
              }))}
              width={chartWidth}
              height={190}
              spacing={step}
              initialSpacing={12}
              endSpacing={20}
              color={C.primary}
              color2="#477FA8"
              thickness={2.5}
              dataPointsColor={C.primary}
              dataPointsColor2="#477FA8"
              dataPointsRadius={4}
              noOfSections={4}
              yAxisLabelWidth={44}
              rulesColor={C.border}
              xAxisColor={C.border}
              yAxisColor="transparent"
              xAxisLabelTextStyle={{ fontSize: 10, color: C.textSecondary }}
              yAxisTextStyle={{ fontSize: 10, color: C.textSecondary }}
              interpolateMissingValues={false}
              extrapolateMissingValues={false}
              showDataPointsForMissingValues={false}
              isAnimated={!reduced}
              curved={false}
            />
          )}
        </View>
      )}
      <Text style={ui.small}>
        Calendar days are spaced equally. Swipe horizontally for more dates.
        Gaps mean no entry; zeros are recorded values.
      </Text>
      {chosen && (
        <View
          accessibilityLiveRegion="polite"
          style={{
            backgroundColor: C.mint,
            borderRadius: 14,
            padding: 14,
            gap: 5,
          }}
        >
          <Text style={ui.body}>
            {dayLabel(chosen.date)} · {chosen.count}{" "}
            {habit ? "daily total" : "readings"}
          </Text>
          <Text style={ui.heading}>
            {fmt(chosen.value)} {unit}
          </Text>
          {!habit && chosen.value != null && (
            <Text style={ui.small}>
              Range {fmt(chosen.min)}–{fmt(chosen.max)} {unit}
            </Text>
          )}
          {second && (
            <Text style={ui.small}>
              Diastolic: {fmt(second[selected!].value)} · range{" "}
              {fmt(second[selected!].min)}–{fmt(second[selected!].max)} mmHg
            </Text>
          )}
        </View>
      )}
      <View style={[ui.row, { flexWrap: "wrap", gap: 8 }]}>
        <Button
          secondary
          disabled={selected == null || selected <= 0}
          onPress={() => setSelected((index) => Math.max(0, (index ?? 0) - 1))}
        >
          Previous day
        </Button>
        <Button
          secondary
          onPress={() =>
            setSelected(
              series.map((point) => point.value != null).lastIndexOf(true),
            )
          }
        >
          Inspect latest day
        </Button>
        <Button
          secondary
          disabled={selected == null || selected >= series.length - 1}
          onPress={() =>
            setSelected((index) =>
              Math.min(series.length - 1, (index ?? 0) + 1),
            )
          }
        >
          Next day
        </Button>
      </View>
    </View>
  );
}
