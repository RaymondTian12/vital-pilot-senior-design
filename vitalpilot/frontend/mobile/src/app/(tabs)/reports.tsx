import { ReportFeedback, type ReportPhase } from "@/components/design/report-feedback";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import * as Sharing from "expo-sharing";
import { usePreview } from "@/context/preview-context";
import { api, ApiError, type ReportHistoryItem } from "@/services/api";
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
import { SleepChart } from "@/components/design/charts";

const PERIODS = { "7 days": 7, "30 days": 30, "90 days": 90 } as const;
type PeriodLabel = keyof typeof PERIODS;

async function shareReportFile(uri: string): Promise<string | null> {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      return null;
    }
    return "Sharing is not available on this device. The PDF is saved on your device's app storage.";
  } catch {
    return "Could not open the share sheet for this report.";
  }
}

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

  const [reportPhase, setReportPhase] = useState<ReportPhase | null>(null);
  const [reportUri, setReportUri] = useState<string | null>(null);
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
    try {
      const { uri } = await api.generateReport(PERIODS[period]);
      setReportUri(uri);
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
    const shareError = await shareReportFile(reportUri);
    if (shareError) setReportError(shareError);
  }

  async function handleHistoryDownload(item: ReportHistoryItem) {
    setDownloadingId(item.report_id);
    setHistoryError(null);
    try {
      const { uri } = await api.downloadReport(item.report_id);
      const shareError = await shareReportFile(uri);
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

  return (
    <Screen>
      <Heading title="Health reports" subtitle="See the bigger picture." />
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
        <Card>
          <PreviewBadge />
          <Text style={ui.heading}>Example overview</Text>
          <Text style={ui.subtitle}>
            Illustrative sleep data · this is not a generated {period} report.
          </Text>
          <Text style={ui.title}>7.3 hours</Text>
          <Text style={ui.small}>
            Average of the seven example readings below
          </Text>
          <SleepChart />
        </Card>
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
