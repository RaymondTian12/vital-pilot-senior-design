import { MetricGuidance } from "./metric-guidance";
import { useCallback, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "@/services/api";
import { attentionReading, goalProgress, recentTrend, summaryValue, summaryWindow, todayReadings, type DailySummaryResponse } from "@/services/daily-summary";
import { vitals, type Metric } from "./vitals-data";
import { Button, Card, ui } from "./ui";
import { Icon } from "./icon";
import { Sparkline } from "./charts";
import { ReadingResult } from "./blood-pressure-panel";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

export function DailySummary() {
  const [data, setData] = useState<DailySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const day = useRef("");
  const router = useRouter();
  const refresh = useCallback(async () => {
    const id = ++generation.current;
    const window = summaryWindow();
    day.current = window.today_start;
    setLoading(true); setError(""); setData(null);
    try {
      const response = await api.dailySummary(window);
      if (generation.current === id) setData(response);
    } catch (cause) {
      if (generation.current === id) setError(cause instanceof Error ? cause.message : "Your summary couldn’t be loaded.");
    } finally {
      if (generation.current === id) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void refresh(); });
    const timer = setInterval(() => {
      if (summaryWindow().today_start !== day.current) void refresh();
    }, 60000);
    return () => { generation.current++; subscription.remove(); clearInterval(timer); };
  }, [refresh]));
  if (!data) return <Card>
    <Text style={ui.heading}>Today’s summary</Text>
    {loading ? <Text accessibilityLiveRegion="polite" style={ui.body}>Gathering your saved readings…</Text> : <>
      <Text accessibilityRole="alert" style={ui.body}>{error || "Your summary is not available yet."}</Text>
      <Button secondary onPress={() => void refresh()}>Retry summary</Button>
    </>}
  </Card>;
  const today = todayReadings(data);
  const names = Object.keys(vitals) as Metric[];
  const attention = attentionReading(data);
  const logged = new Set(today.map((reading) => reading.metric_type)).size;
  return <View style={{ gap: 18 }}>
    <Card style={{ backgroundColor: C.blue }}>
      <Text accessibilityRole="header" style={ui.heading}>Today’s summary</Text>
      <Text style={ui.body}>{logged} of 8 metric types logged today</Text>
      <Text style={ui.small}>Based on saved entries in your phone’s local day. Logging progress does not measure how healthy you are.</Text>
      <Button secondary disabled={loading} onPress={() => void refresh()}>Refresh summary</Button>
    </Card>
    <Card>
      <Text accessibilityRole="header" style={ui.heading}>Overall result</Text>
      <Text style={[ui.heading, { color: data.overall_result?.status === "urgent" ? C.danger : data.overall_result?.status === "no_alerts" ? C.primaryDark : C.warning }]}>{data.overall_result?.title || "Assessment unavailable"}</Text>
      <Text style={ui.body}>{data.overall_result?.message || "The readings are saved, but the overall assessment is not available. This is not a normal or clear result."}</Text>
      {data.overall_result && <>
        <Text style={ui.small}>Habit goals: {data.overall_result.habit_goals_met} met · {data.overall_result.habit_goals_below} below target. Habit goals are separate from health alerts.</Text>
        {[...data.overall_result.urgent_readings, ...data.overall_result.warning_readings].map((reason) => {
          const name = names.find((value) => vitals[value].type === reason.metric_type) || reason.metric_type;
          return <Button key={`${reason.metric_type}-${reason.log_id}`} secondary onPress={() => router.push({ pathname: "/metrics", params: { metric: name } })}>{name}: {reason.classification}</Button>;
        })}
      </>}
    </Card>
    {attention && <Card>
      <Text accessibilityRole="header" style={ui.heading}>Blood pressure to review</Text>
      <Text style={ui.small}>A saved reading from today needs review. An earlier alert remains here even if a later reading is lower.</Text>
      <ReadingResult reading={attention} showCare />
    </Card>}
    {!!data.truncated_metrics.length && <Card><Text style={ui.body}>Some recent history is too long to include in full. Open each metric’s history for more readings.</Text></Card>}
    <Text accessibilityRole="header" style={ui.heading}>Your readings today</Text>
    <Text style={ui.small}>Latest saved entry for each metric. No entry means no reading was saved today.</Text>
    {names.map((name) => {
      const config = vitals[name];
      const latest = today.find((reading) => reading.metric_type === config.type);
      const entryGoal = latest && latest.metric_type !== "BLOOD_PRESSURE" ? latest.classification?.context.goal_value : undefined;
      const progress = goalProgress(latest, typeof entryGoal === "number" ? entryGoal : data.goals[config.type]);
      const habit = ["SLEEP", "PHYSICAL_ACTIVITY", "WATER_INTAKE"].includes(config.type);
      const trend = recentTrend(data, config.type);
      return <Card key={name}>
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <View style={[ui.row, { flex: 1 }]}><Icon name={config.icon} size={23} /><Text style={[ui.heading, { flexShrink: 1 }]}>{name}</Text></View>
          {latest && <Icon name="check" size={20} />}
        </View>
        <Text style={ui.title}>{latest ? `${summaryValue(latest)} ${config.unit}` : "No entry today"}</Text>
        {latest && <Text style={ui.small}>{new Date(latest.recorded_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</Text>}
        {latest?.metric_type === "BODY_MASS_INDEX" && <Text style={ui.body}>BMI: {latest.bmi_value?.toFixed(1)}</Text>}
        {latest && latest.metric_type !== "BLOOD_PRESSURE" && <MetricGuidance assessment={latest.classification} />}
        {data.overall_result?.urgent_readings.filter((reason) => reason.metric_type === config.type && reason.log_id !== latest?.log_id).map((reason) => {
          const earlier = today.find((reading) => reading.metric_type === reason.metric_type && reading.log_id === reason.log_id);
          return earlier && earlier.metric_type !== "BLOOD_PRESSURE" ? <View key={reason.log_id} style={{ gap: 8 }}>
            <Text style={[ui.body, { fontWeight: "700", color: C.danger }]}>Earlier critical reading today: {summaryValue(earlier)} {config.unit}</Text>
            <Text style={ui.small}>{new Date(earlier.recorded_at).toLocaleTimeString()}</Text>
            <MetricGuidance assessment={earlier.classification} />
          </View> : null;
        })}
        {habit && <View style={{ gap: 8 }}>
          <Text style={ui.small}>{progress ? `Latest entry: ${progress.value} of ${progress.goal} ${config.unit} goal` : data.goals[config.type] ? `Your goal: ${data.goals[config.type]} ${config.unit}` : "No personal goal saved"}</Text>
          {progress && <>
            <View accessibilityRole="progressbar" accessibilityLabel={`${name} latest entry versus personal goal`} accessibilityValue={{ min: 0, max: 100, now: Math.round(progress.percent) }} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.percent)} style={{ height: 7, borderRadius: 4, backgroundColor: C.border, overflow: "hidden" }}>
              <View style={{ height: 7, width: `${progress.percent}%`, backgroundColor: C.primary, borderRadius: 4 }} />
            </View>
            <Text style={ui.small}>{progress.reached ? "Latest entry meets your saved goal" : `${Math.round(progress.percent)}% of your saved goal`}</Text>
          </>}
          <Text style={ui.small}>Uses your latest entry, not the sum of repeated entries.</Text>
        </View>}
        {trend.length >= 2 && <View style={{ gap: 5 }}>
          <Text style={ui.small}>Last {trend.length} saved readings within 7 local days{config.type === "BLOOD_PRESSURE" ? " · systolic" : ""}</Text>
          <Sparkline values={trend} label={`${name} saved readings in ${config.unit}`} />
        </View>}
        <Button secondary onPress={() => router.push({ pathname: "/metrics", params: { metric: name } })}>{latest ? "View or add reading" : "Log reading"}</Button>
      </Card>;
    })}
    <Text style={ui.small}>Health readings use configured reference ranges and the available measurement context. Habit results compare your latest entry with personal goals. The overall result is a review of recorded information, not a diagnosis or a healthy/unhealthy score.</Text>
  </View>;
}
