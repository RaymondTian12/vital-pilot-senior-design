import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { vitals, type Metric } from "@/components/design/vitals-data";
import { Card, Heading, Screen, ui } from "@/components/design/ui";
import {
  MetricHistorySection,
  PeriodControl,
} from "@/components/design/metric-history-section";
import { historyPeriod } from "@/services/metric-history";
import { useBloodPressure } from "@/context/blood-pressure-context";
import { useVitalReading } from "@/context/vital-readings-context";
import { Button } from "@/components/design/ui";
function SaveRecovery({ name }: { name: Metric }) {
  const type = vitals[name].type;
  const bp = useBloodPressure();
  const other = useVitalReading(
    type === "BLOOD_PRESSURE" ? "BLOOD_GLUCOSE" : type,
  );
  const store = type === "BLOOD_PRESSURE" ? bp : other;
  useEffect(() => {
    if (store.uncertain) void store.refresh();
  }, [store.uncertain, store.refresh]);
  if (!store.uncertain) return null;
  return (
    <Card>
      <Text style={ui.body}>
        A previous save may have completed. Check the saved readings before
        retrying.
      </Text>
      <Button
        secondary
        disabled={!store.retryReady || store.loading}
        onPress={store.allowRetry}
      >
        I checked history — enable retry
      </Button>
    </Card>
  );
}
export default function MetricHistory() {
  const { metric, days: requestedDays } = useLocalSearchParams<{
    metric?: string | string[];
    days?: string | string[];
  }>();
  const [days, setDays] = useState(historyPeriod(requestedDays));
  useEffect(() => setDays(historyPeriod(requestedDays)), [requestedDays]);
  const value = Array.isArray(metric) ? metric[0] : metric;
  const name = (Object.keys(vitals) as Metric[]).find(
    (name) => vitals[name].type === value || name === value,
  );
  return (
    <Screen back>
      <Heading
        title={name ? `${name} history` : "Metric history"}
        subtitle="Your readings. A clearer picture over time."
      />
      {!name ? (
        <Card>
          <Text style={ui.body}>
            Choose a metric from Vitals to view its history.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 18 }}>
          <PeriodControl value={days} onChange={setDays} />
          <SaveRecovery name={name} />
          <MetricHistorySection key={name} name={name} days={days} />
        </View>
      )}
    </Screen>
  );
}
