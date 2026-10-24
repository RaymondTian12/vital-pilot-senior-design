import { MetricGuidance } from "./metric-guidance";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useVitalReading } from "@/context/vital-readings-context";
import { useAuth } from "@/context/auth-context";
import type { OtherMetricReading, OtherVitalType } from "@/types/vitalpilot";
import { readingValue } from "@/services/vital-readings";
import { Button, Card, ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export function VitalReadingResult({ reading, unit, onFindCare, showActions = true }: { reading: OtherMetricReading; unit: string; onFindCare?: () => void; showActions?: boolean }) {
  return <View style={{ gap: 7 }}>
    <Text style={ui.heading}>{readingValue(reading)} {unit}</Text>
    <Text style={ui.small}>{new Date(reading.recorded_at).toLocaleString()}</Text>
    {reading.metric_type === "BODY_MASS_INDEX" && <Text style={ui.body}>BMI: {reading.bmi_value?.toFixed(1)}</Text>}
    <MetricGuidance assessment={reading.classification} onFindCare={onFindCare} showActions={showActions} />
  </View>;
}
export function VitalHistoryPanel({ type, name, unit }: { type: OtherVitalType; name: string; unit: string }) {
  const readings = useVitalReading(type);
  const { signOut } = useAuth();
  useFocusEffect(useCallback(() => { void readings.refresh(); }, [readings.refresh]));
  return <Card>
    <Text style={ui.heading}>Your {name.toLowerCase()} history</Text>
    {readings.loading && <Text accessibilityLiveRegion="polite" style={ui.small}>Loading readings…</Text>}
    {!!readings.error && <Text accessibilityRole="alert" style={{ color: C.danger }}>{readings.error}</Text>}
    {readings.authExpired ? <Button onPress={() => void signOut()}>Sign in again</Button> : <Button secondary disabled={readings.loading || readings.saving} onPress={() => void readings.refresh()}>Refresh readings</Button>}
    {readings.uncertain && <>
      <Text style={ui.body}>A previous save may have completed. Review the refreshed history before retrying.</Text>
      <Button secondary disabled={!readings.retryReady || readings.loading} onPress={readings.allowRetry}>I checked history — enable retry</Button>
    </>}
    {!readings.records.length && readings.loaded && !readings.error && <Text style={ui.body}>No saved readings yet. Add your first reading to start your history.</Text>}
    {readings.records.map((reading) => <View key={reading.log_id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}><VitalReadingResult reading={reading} unit={unit} showActions={reading.log_id === readings.records[0]?.log_id} /></View>)}
    {readings.more && <Button secondary disabled={readings.loading || readings.saving} onPress={() => void readings.loadMore()}>Load more readings</Button>}
  </Card>;
}
