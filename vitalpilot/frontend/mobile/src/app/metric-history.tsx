import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { BloodPressurePanel } from "@/components/design/blood-pressure-panel";
import { VitalHistoryPanel } from "@/components/design/vital-history-panel";
import { vitals, type Metric } from "@/components/design/vitals-data";
import { Card, Heading, Screen, ui } from "@/components/design/ui";

export default function MetricHistory() {
  const { metric } = useLocalSearchParams<{ metric?: string | string[] }>();
  const value = Array.isArray(metric) ? metric[0] : metric;
  const name = (Object.keys(vitals) as Metric[]).find((name) => vitals[name].type === value || name === value);
  if (!name) return <Screen back><Heading title="Metric history" subtitle="Choose a metric from Vitals." /><Card><Text style={ui.body}>This metric was not found. Go back and tap View history on a metric.</Text></Card></Screen>;
  const config = vitals[name];
  return <Screen back>
    <Heading title={`${name} history`} subtitle="Your saved readings, newest first." />
    {config.type === "BLOOD_PRESSURE" ? <BloodPressurePanel /> : <VitalHistoryPanel type={config.type} name={name} unit={config.unit} />}
  </Screen>;
}
