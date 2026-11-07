import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { SignOutButton } from "@/components/sign-out-button";
import type { VitalType } from "@/types/vitalpilot";
import { Button, Card, Chip, Heading, Notice, Screen, ui } from "@/components/design/ui";

const METRICS: VitalType[] = ["BLOOD_PRESSURE", "BLOOD_GLUCOSE", "BLOOD_OXYGEN", "BODY_MASS_INDEX", "PEAK_FLOW_RATE", "WATER_INTAKE", "PHYSICAL_ACTIVITY", "SLEEP"];
const LABELS: Record<VitalType, string> = {
  BLOOD_PRESSURE: "Blood pressure", BLOOD_GLUCOSE: "Blood glucose", BLOOD_OXYGEN: "Blood oxygen",
  BODY_MASS_INDEX: "Weight and BMI", PEAK_FLOW_RATE: "Peak flow", WATER_INTAKE: "Water intake",
  PHYSICAL_ACTIVITY: "Physical activity", SLEEP: "Sleep",
};
const VALUES: Record<string, string> = {
  systolic_mmhg: "Systolic (mmHg)", diastolic_mmhg: "Diastolic (mmHg)", glucose_mgdl: "Glucose (mg/dL)",
  spo2_percentage: "Blood oxygen (%)", weight_lbs: "Weight (lb)", bmi_value: "BMI",
  flow_rate_lmin: "Peak flow (L/min)", amount_cups: "Water (cups)", steps_taken: "Steps", duration_hours: "Sleep (hours)",
};
type Reading = { log_id: number; recorded_at: string; metric_type: string; [key: string]: unknown };
export default function DoctorPatient() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const [patient, setPatient] = useState<{ first_name: string; last_name: string } | null>(null);
  const [metric, setMetric] = useState<VitalType>("BLOOD_PRESSURE");
  const [records, setRecords] = useState<Reading[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) { setError("Invalid patient"); setLoading(false); return; }
    setLoading(true);
    try {
      setError("");
      const [person, page] = await Promise.all([api.doctorPatient(id), api.doctorPatientMetrics(id, metric)]);
      setPatient(person); setRecords(page.records);
    } catch (e) { setPatient(null); setRecords([]); setError(e instanceof Error ? e.message : "Unable to load records."); }
    finally { setLoading(false); }
  }, [id, metric]);
  useEffect(() => { void load(); }, [load]);
  return <Screen back backFallback="/doctor-portal" brand={false}>
    <SignOutButton />
    <Heading title={patient ? `${patient.first_name} ${patient.last_name}` : "Patient records"} subtitle="Readings shared by this patient" />
    {!!error && <Notice error>{error}</Notice>}
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {METRICS.map((m) => <Chip key={m} selected={metric === m} onPress={() => setMetric(m)}>{LABELS[m]}</Chip>)}
    </View>
    {loading && <Text style={ui.body}>Loading readings…</Text>}
    {!loading && !error && !records.length && <Text style={ui.body}>No readings for this metric.</Text>}
    {records.map((r) => <Card key={r.log_id}>
      <Text style={ui.small}>{new Date(r.recorded_at).toLocaleString()}</Text>
      {Object.entries(r).filter(([key]) => !["log_id", "recorded_at", "metric_type"].includes(key)).map(([key, value]) =>
        <Text key={key} style={ui.body}>{VALUES[key] ?? key}: {String(value)}</Text>)}
    </Card>)}
    <Button secondary onPress={() => void load()}>Refresh</Button>
  </Screen>;
}
