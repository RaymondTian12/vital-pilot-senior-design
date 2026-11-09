import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "@/services/api";
import { historyWindow, type HistoryPeriod } from "@/services/metric-history";
import {
  summaryValue,
  type DailySummaryResponse,
} from "@/services/daily-summary";
import { vitals, type Metric } from "@/components/design/vitals-data";
import { Button, Card, Heading, Screen, ui } from "@/components/design/ui";
import {
  MetricHistorySection,
  PeriodControl,
} from "@/components/design/metric-history-section";
import { ReportExports } from "@/components/design/report-exports";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export default function Reports() {
  const [days, setDays] = useState<HistoryPeriod>(30),
    [metric, setMetric] = useState<Metric>("Blood Pressure");
  const [data, setData] = useState<DailySummaryResponse | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setData(null);
      setError("");
      api
        .metricReport(historyWindow(days))
        .then((result) => {
          if (active) setData(result);
        })
        .catch(() => {
          if (active)
            setError(
              "Couldn’t refresh the overview. Retry to load your report period.",
            );
        });
      return () => {
        active = false;
      };
    }, [days, retry]),
  );
  return (
    <Screen>
      <Heading
        title="Health reports"
        subtitle="Explore your progress, one metric at a time."
      />
      <PeriodControl value={days} onChange={setDays} />
      <Text style={ui.small}>
        Select a metric below. Charts use saved data; missing entries do not
        imply normal health.
      </Text>
      {!!error && (
        <Card>
          <Text accessibilityRole="alert" style={ui.body}>
            {error}
          </Text>
          <Button secondary onPress={() => setRetry((value) => value + 1)}>
            Retry overview
          </Button>
        </Card>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {(Object.keys(vitals) as Metric[]).map((name) => {
          const latest = data?.records
            .filter((record) => record.metric_type === vitals[name].type)
            .sort(
              (a, b) =>
                Date.parse(b.recorded_at) - Date.parse(a.recorded_at) ||
                b.log_id - a.log_id,
            )[0];
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected: name === metric }}
              onPress={() => setMetric(name)}
              style={{
                width: "48%",
                minHeight: 112,
                padding: 14,
                borderRadius: 16,
                borderWidth: name === metric ? 2 : 1,
                borderColor: name === metric ? C.primary : C.border,
                backgroundColor: name === metric ? C.mint : C.white,
                gap: 7,
              }}
            >
              <Text style={[ui.body, { fontWeight: "700" }]}>{name}</Text>
              <Text style={ui.heading}>
                {latest ? summaryValue(latest) : "—"}
              </Text>
              <Text style={ui.small}>
                {vitals[name].unit} ·{" "}
                {data
                  ? latest
                    ? "latest saved"
                    : "no entries"
                  : "loading overview"}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <MetricHistorySection key={metric} name={metric} days={days} />
      <Button
        secondary
        onPress={() =>
          router.push({
            pathname: "/metric-history",
            params: { metric: vitals[metric].type, days: String(days) },
          })
        }
      >
        Open {metric.toLowerCase()} history
      </Button>
      <ReportExports data={data} />
    </Screen>
  );
}
