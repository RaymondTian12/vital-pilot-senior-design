import { useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TurboModuleRegistry,
  View,
} from "react-native";
import {
  chartLayout,
  chartScrollOffset,
  latestChartIndex,
} from "@/services/chart-layout";
import {
  chartSeries,
  dayLabel,
  type MetricHistoryData,
} from "@/services/metric-history";
import { useMotionPreference } from "./motion";
import { Button, Chip, ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const DIASTOLIC_COLOR = "#477FA8";
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
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const reduced = useMotionPreference();
  const series = chartSeries(data.daily, field, context);
  const second =
    data.metric_type === "BLOOD_PRESSURE"
      ? chartSeries(data.daily, "diastolic_mmhg")
      : null;
  const layout = chartLayout(containerWidth, series.length, habit);
  const latest = latestChartIndex(series);
  const selectionKey = `${data.metric_type}:${data.start_at}:${data.end_at}:${field}:${context}`;
  const [selectedKey, setSelectedKey] = useState(selectionKey);
  const selectedIndex = selectedKey === selectionKey ? selected : null;
  function inspect(index: number) {
    if (index < 0 || index >= series.length) return;
    setSelectedKey(selectionKey);
    setSelected(index);
    scrollRef.current?.scrollTo({
      x: chartScrollOffset(index, layout),
      animated: !reduced,
    });
  }
  useEffect(() => {
    setSelected(null);
    setSelectedKey(selectionKey);
  }, [selectionKey]);
  useEffect(() => {
    if (series.length <= 7 || latest < 0 || !containerWidth) return;
    // Wait until the newly sized ScrollView exists; the library also sets the
    // initial scroll position on content layout below.
    const frame = requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({
        x: chartScrollOffset(latest, layout),
        animated: false,
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [selectionKey, containerWidth, latest]);
  const labelEvery = series.length <= 7 ? 1 : 5;
  const label = (index: number) =>
    index % labelEvery === 0 || index === series.length - 1
      ? dayLabel(series[index].date)
      : "";
  const points = series.map((point, index) => ({
    value: point.value,
    label: label(index),
    onPress: () => inspect(index),
    hideDataPoint: point.value == null,
  }));
  let Charts: typeof import("react-native-gifted-charts") | null = null;
  try {
    if (
      Platform.OS !== "web" &&
      !TurboModuleRegistry.get("RNSVGRenderableModule")
    )
      throw new Error("SVG native module missing");
    Charts = require("react-native-gifted-charts");
  } catch {
    /* An older native build can still use the table. */
  }
  const chosen = selectedIndex == null ? null : series[selectedIndex];
  const shown = series.filter((point) => point.value != null);
  return (
    <View
      style={{ gap: 14 }}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
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
        <View style={[ui.row, { flexWrap: "wrap", gap: 16 }]}>
          <View style={[ui.row, { gap: 6 }]}>
            <View
              accessible={false}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: C.primary,
              }}
            />
            <Text style={[ui.small, { color: C.primaryDark }]}>
              Systolic (teal)
            </Text>
          </View>
          <View style={[ui.row, { gap: 6 }]}>
            <View
              accessible={false}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: DIASTOLIC_COLOR,
              }}
            />
            <Text style={[ui.small, { color: DIASTOLIC_COLOR }]}>
              Diastolic (blue)
            </Text>
          </View>
        </View>
      )}
      {!shown.length ? (
        <Text style={ui.body}>No readings for this selection.</Text>
      ) : !Charts ? (
        <Text style={ui.body}>
          Rebuild the development app to display the new charts. Readings remain
          available below.
        </Text>
      ) : containerWidth <= 0 ? null : (
        <View style={{ paddingTop: 8 }}>
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
                onPress: () => inspect(index),
              }))}
              width={layout.width}
              height={190}
              spacing={layout.spacing}
              barWidth={layout.barWidth}
              initialSpacing={layout.initialSpacing}
              endSpacing={layout.endSpacing}
              minHeight={2}
              scrollRef={scrollRef}
              scrollToIndex={
                series.length > 7 && latest >= 0 ? latest : undefined
              }
              scrollAnimation={false}
              showScrollIndicator={series.length > 7}
              // Static bars avoid an invisible native animation when only the
              // final day has data. Zero gets a 2px mark; gaps stay transparent.
              isAnimated={false}
              barBorderTopLeftRadius={5}
              barBorderTopRightRadius={5}
              noOfSections={4}
              yAxisLabelWidth={layout.axisWidth}
              rulesColor={C.border}
              xAxisColor={C.border}
              yAxisColor="transparent"
              xAxisLabelTextStyle={{ fontSize: 10, color: C.textSecondary }}
              yAxisTextStyle={{ fontSize: 10, color: C.textSecondary }}
            />
          ) : (
            <Charts.LineChart
              key={`line-${reduced}`}
              data={points}
              data2={second?.map((point, index) => ({
                value: point.value,
                label: label(index),
                onPress: () => inspect(index),
              }))}
              width={layout.width}
              height={190}
              spacing={layout.spacing}
              initialSpacing={layout.initialSpacing}
              endSpacing={layout.endSpacing}
              scrollRef={scrollRef}
              scrollToIndex={
                series.length > 7 && latest >= 0 ? latest : undefined
              }
              scrollAnimation={false}
              showScrollIndicator={series.length > 7}
              color={C.primary}
              color2={DIASTOLIC_COLOR}
              thickness={2.5}
              dataPointsColor={C.primary}
              dataPointsColor2={DIASTOLIC_COLOR}
              dataPointsRadius={4}
              noOfSections={4}
              yAxisLabelWidth={layout.axisWidth}
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
              Diastolic: {fmt(second[selectedIndex!].value)} · range{" "}
              {fmt(second[selectedIndex!].min)}–
              {fmt(second[selectedIndex!].max)} mmHg
            </Text>
          )}
        </View>
      )}
      <View style={[ui.row, { flexWrap: "wrap", gap: 8 }]}>
        <Button
          secondary
          disabled={selectedIndex == null || selectedIndex <= 0}
          onPress={() => inspect((selectedIndex ?? 0) - 1)}
        >
          Previous day
        </Button>
        <Button secondary disabled={latest < 0} onPress={() => inspect(latest)}>
          Inspect latest day
        </Button>
        <Button
          secondary
          disabled={selectedIndex == null || selectedIndex >= series.length - 1}
          onPress={() => inspect((selectedIndex ?? 0) + 1)}
        >
          Next day
        </Button>
      </View>
    </View>
  );
}
