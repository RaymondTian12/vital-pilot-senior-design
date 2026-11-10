import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, ApiError } from "@/services/api";
import { sharePdfFile } from "@/services/share-file";
import { SignOutButton } from "@/components/sign-out-button";
import type { VitalType } from "@/types/vitalpilot";
import { Button, Card, Chip, Heading, Notice, Screen, ui } from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

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
type Alert = { notification_id: number; title: string; message: string; severity: "warning" | "critical"; metric_name: string | null; metric_value: string | null; created_at: string };
type ReportItem = { report_id: number; report_title: string; start_date: string; end_date: string; file_size_kb: number; created_at: string; downloadable: boolean; previewable: boolean };
type ViewMode = "readings" | "alerts" | "reports";

export default function DoctorPatient() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [patient, setPatient] = useState<{ first_name: string; last_name: string } | null>(null);
  const [view, setView] = useState<ViewMode>("readings");
  const [metric, setMetric] = useState<VitalType>("BLOOD_PRESSURE");
  const [records, setRecords] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) { setError("Invalid patient"); setLoading(false); return; }
    setLoading(true);
    try {
      setError("");
      const [person] = await Promise.all([api.doctorPatient(id)]);
      setPatient(person);
      if (view === "readings") {
        const page = await api.doctorPatientMetrics(id, metric);
        setRecords(page.records);
      } else if (view === "alerts") {
        const result = await api.doctorPatientAlerts(id);
        setAlerts(result.alerts);
      } else {
        const result = await api.doctorPatientReports(id);
        setReports(result.reports);
      }
    } catch (e) {
      setPatient(null); setRecords([]); setAlerts([]); setReports([]);
      setError(e instanceof Error ? e.message : "Unable to load records.");
    } finally { setLoading(false); }
  }, [id, metric, view]);
  useEffect(() => { void load(); }, [load]);

  async function handleDownload(report: ReportItem) {
    setDownloadingId(report.report_id);
    setError("");
    try {
      const { uri } = await api.doctorPatientReportDownload(id, report.report_id);
      const shareError = await sharePdfFile(uri);
      if (shareError) setError(shareError);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Failed to download report.");
    } finally {
      setDownloadingId(null);
    }
  }

  return <Screen back backFallback="/doctor-portal" brand={false}>
    <SignOutButton />
    <Heading title={patient ? `${patient.first_name} ${patient.last_name}` : "Patient records"} subtitle="Shared by this patient" />
    {!!error && <Notice error>{error}</Notice>}
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Chip selected={view === "readings"} onPress={() => setView("readings")}>Readings</Chip>
      <Chip selected={view === "alerts"} onPress={() => setView("alerts")}>Alerts</Chip>
      <Chip selected={view === "reports"} onPress={() => setView("reports")}>Reports</Chip>
    </View>

    {view === "readings" && <>
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
    </>}

    {view === "alerts" && <>
      <Text style={ui.small}>Warning and critical alerts raised by this patient's saved readings. Routine save confirmations are not shown here.</Text>
      {loading && <Text style={ui.body}>Loading alerts…</Text>}
      {!loading && !error && !alerts.length && <Text style={ui.body}>No alerts for this patient.</Text>}
      {alerts.map((a) => <Card key={a.notification_id} style={{ borderColor: a.severity === "critical" ? C.danger : C.warning }}>
        <Text style={[ui.eyebrow, { color: a.severity === "critical" ? C.danger : C.textSecondary }]}>{a.severity.toUpperCase()}{a.metric_name ? ` · ${a.metric_name}` : ""}</Text>
        <Text style={[ui.body, { fontWeight: "700" }]}>{a.title}</Text>
        <Text style={ui.body}>{a.message}</Text>
        <Text style={ui.small}>{new Date(a.created_at).toLocaleString()}</Text>
      </Card>)}
    </>}

    {view === "reports" && <>
      {loading && <Text style={ui.body}>Loading reports…</Text>}
      {!loading && !error && !reports.length && <Text style={ui.body}>No generated reports for this patient.</Text>}
      {reports.map((item) => <Card key={item.report_id}>
        <Text style={ui.heading}>{item.report_title}</Text>
        <Text style={ui.small}>{item.start_date} to {item.end_date} · generated {new Date(item.created_at).toLocaleDateString()}</Text>
        <Button secondary disabled={!item.previewable} onPress={() => router.push({ pathname: "/doctor-report-preview", params: { id: String(id), reportId: String(item.report_id) } })}>
          {item.previewable ? "View in app" : "Not available to preview"}
        </Button>
        <Button secondary disabled={!item.downloadable || downloadingId === item.report_id} onPress={() => void handleDownload(item)}>
          {!item.downloadable ? "Not available for re-download" : downloadingId === item.report_id ? "Downloading…" : "Download"}
        </Button>
      </Card>)}
    </>}

    <Button secondary onPress={() => void load()}>Refresh</Button>
  </Screen>;
}
