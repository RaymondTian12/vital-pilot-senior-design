import { ReportFeedback, type ReportPhase } from "@/components/design/report-feedback";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { usePreview } from "@/context/preview-context";
import { api, ApiError, type ReportHistoryItem } from "@/services/api";
import { sharePdfFile } from "@/services/share-file";
import { historyWindow, type HistoryPeriod } from "@/services/metric-history";
import {
  summaryValue,
  type DailySummaryResponse,
} from "@/services/daily-summary";
import { vitals, type Metric } from "@/components/design/vitals-data";
import {
  Button,
  Card,
  Chip,
  Empty,
  Heading,
  Notice,
  PreviewBadge,
  Screen,
  ui,
} from "@/components/design/ui";
import {
  MetricHistorySection,
  PeriodControl,
} from "@/components/design/metric-history-section";
import { ReportPreviewBody } from "@/components/design/report-preview-body";
import { buildSampleReportPreview } from "@/constants/sample-report";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

const PERIODS = { "7 days": 7, "30 days": 30, "90 days": 90 } as const;
type PeriodLabel = keyof typeof PERIODS;

export default function Reports() {
  const [demoPhase, setDemoPhase] = useState<ReportPhase | null>(null);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (demoTimer.current) clearTimeout(demoTimer.current); }, []);
  function previewCompletion() {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setDemoPhase("generating");
    demoTimer.current = setTimeout(() => setDemoPhase("ready"), 1500);
  }

  const [period, setPeriod] = useState<PeriodLabel>("30 days");
  const { preview, setPreview } = usePreview();
  const router = useRouter();

  const [reportPhase, setReportPhase] = useState<ReportPhase | null>(null);
  const [reportUri, setReportUri] = useState<string | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const [history, setHistory] = useState<ReportHistoryItem[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const { reports } = await api.getReportHistory();
      setHistory(reports);
      setHistoryError(null);
    } catch (error: unknown) {
      setHistoryError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to load report history.",
      );
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleGenerate() {
    setReportPhase("generating");
    setReportError(null);
    setReportUri(null);
    setReportId(null);
    try {
      const { uri, reportId: newReportId } = await api.generateReport(PERIODS[period]);
      setReportUri(uri);
      setReportId(newReportId);
      setReportPhase("ready");
      loadHistory();
    } catch (error: unknown) {
      setReportError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to generate report.",
      );
      setReportPhase("error");
    }
  }

  async function handleDownload() {
    if (!reportUri) return;
    const shareError = await sharePdfFile(reportUri);
    if (shareError) setReportError(shareError);
  }

  async function handleHistoryDownload(item: ReportHistoryItem) {
    setDownloadingId(item.report_id);
    setHistoryError(null);
    try {
      const { uri } = await api.downloadReport(item.report_id);
      const shareError = await sharePdfFile(uri);
      if (shareError) setHistoryError(shareError);
    } catch (error: unknown) {
      setHistoryError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to download report.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  const [overviewDays, setOverviewDays] = useState<HistoryPeriod>(30);
  const [overviewMetric, setOverviewMetric] = useState<Metric>("Blood Pressure");
  const [overviewData, setOverviewData] = useState<DailySummaryResponse | null>(null);
  const [overviewError, setOverviewError] = useState("");
  const [overviewRetry, setOverviewRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setOverviewData(null);
      setOverviewError("");
      api
        .metricReport(historyWindow(overviewDays))
        .then((result) => {
          if (active) setOverviewData(result);
        })
        .catch(() => {
          if (active)
            setOverviewError(
              "Couldn’t refresh the overview. Retry to load your report period.",
            );
        });
      return () => {
        active = false;
      };
    }, [overviewDays, overviewRetry]),
  );

  return (
    <Screen>
      <Heading title="Health reports" subtitle="See the bigger picture." />

      <Text style={ui.heading}>Metric overview</Text>
      <PeriodControl value={overviewDays} onChange={setOverviewDays} />
      <Text style={ui.small}>
        Select a metric below. Charts use saved data; missing entries do not
        imply normal health.
      </Text>
      {!!overviewError && (
        <Card>
          <Text accessibilityRole="alert" style={ui.body}>
            {overviewError}
          </Text>
          <Button secondary onPress={() => setOverviewRetry((value) => value + 1)}>
            Retry overview
          </Button>
        </Card>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {(Object.keys(vitals) as Metric[]).map((name) => {
          const latest = overviewData?.records
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
              accessibilityState={{ selected: name === overviewMetric }}
              onPress={() => setOverviewMetric(name)}
              style={{
                width: "48%",
                minHeight: 112,
                padding: 14,
                borderRadius: 16,
                borderWidth: name === overviewMetric ? 2 : 1,
                borderColor: name === overviewMetric ? C.primary : C.border,
                backgroundColor: name === overviewMetric ? C.mint : C.white,
                gap: 7,
              }}
            >
              <Text style={[ui.body, { fontWeight: "700" }]}>{name}</Text>
              <Text style={ui.heading}>
                {latest ? summaryValue(latest) : "—"}
              </Text>
              <Text style={ui.small}>
                {vitals[name].unit} ·{" "}
                {overviewData
                  ? latest
                    ? "latest saved"
                    : "no entries"
                  : "loading overview"}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <MetricHistorySection key={overviewMetric} name={overviewMetric} days={overviewDays} />
      <Button
        secondary
        onPress={() =>
          router.push({
            pathname: "/metric-history",
            params: { metric: vitals[overviewMetric].type, days: String(overviewDays) },
          })
        }
      >
        Open {overviewMetric.toLowerCase()} history
      </Button>

      <Text style={ui.heading}>Generate a report</Text>
      <View style={[ui.row, { flexWrap: "wrap" }]}>
        {(Object.keys(PERIODS) as PeriodLabel[]).map((value) => (
          <Chip
            key={value}
            selected={period === value}
            onPress={() => setPeriod(value)}
          >
            {value}
          </Chip>
        ))}
      </View>
      {preview ? (
        <>
          <Card>
            <PreviewBadge />
            <Text style={ui.heading}>Sample {period} report</Text>
            <Text style={ui.subtitle}>
              Made-up data, shown in the exact layout a real report uses · this is not a
              generated {period} report.
            </Text>
          </Card>
          <ReportPreviewBody data={buildSampleReportPreview(PERIODS[period])} />
        </>
      ) : (
        <>
          <Empty
            title="Your story, over time"
            message="Generate a report below to summarize your saved readings for this period."
          />
          <Button secondary onPress={() => setPreview(true)}>
            Preview a sample summary
          </Button>
        </>
      )}
      <Card>
        <Text style={ui.heading}>A preview of the finishing touch</Text>
        <Text style={ui.small}>Try the report completion animation. This preview does not generate a PDF or access your readings.</Text>
        <Button secondary disabled={demoPhase === "generating"} onPress={previewCompletion}>
          {demoPhase === "generating" ? "Previewing…" : demoPhase === "ready" ? "Replay animation" : "Preview completion animation"}
        </Button>
        {demoPhase && <ReportFeedback phase={demoPhase} preview />}
      </Card>
      <Button
        disabled={reportPhase === "generating"}
        onPress={handleGenerate}
      >
        {reportPhase === "generating" ? "Generating…" : "Generate report"}
      </Button>
      <Button secondary disabled={!reportUri} onPress={handleDownload}>
        Download PDF
      </Button>
      <Button
        secondary
        disabled={!reportId}
        onPress={() =>
          reportId &&
          router.push({ pathname: "/report-preview", params: { id: String(reportId) } })
        }
      >
        View in app
      </Button>
      {reportPhase && <ReportFeedback phase={reportPhase} />}
      {reportError && <Notice>{reportError}</Notice>}
      <Text style={ui.heading}>Report history</Text>
      {historyError && <Notice>{historyError}</Notice>}
      {history === null ? (
        <Text style={ui.small}>Loading report history…</Text>
      ) : history.length === 0 ? (
        <Empty
          title="No generated reports yet"
          message="Completed reports will appear here."
        />
      ) : (
        history.map((item) => (
          <Card key={item.report_id}>
            <Text style={ui.heading}>{item.report_title}</Text>
            <Text style={ui.small}>
              {item.start_date} to {item.end_date} · generated{" "}
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <Button
              secondary
              disabled={!item.previewable}
              onPress={() =>
                router.push({
                  pathname: "/report-preview",
                  params: { id: String(item.report_id) },
                })
              }
            >
              {item.previewable ? "View in app" : "Not available to preview"}
            </Button>
            <Button
              secondary
              disabled={!item.downloadable || downloadingId === item.report_id}
              onPress={() => handleHistoryDownload(item)}
            >
              {!item.downloadable
                ? "Not available for re-download"
                : downloadingId === item.report_id
                  ? "Downloading…"
                  : "Download"}
            </Button>
          </Card>
        ))
      )}
    </Screen>
  );
}
