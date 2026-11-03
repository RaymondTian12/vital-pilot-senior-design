import { ReportFeedback, type ReportPhase } from "@/components/design/report-feedback";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import * as Sharing from "expo-sharing";
import { usePreview } from "@/context/preview-context";
import { api, ApiError } from "@/services/api";
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

  async function handleGenerate() {
    setReportPhase("generating");
    setReportError(null);
    setReportUri(null);
    try {
      const { uri } = await api.generateReport(PERIODS[period]);
      setReportUri(uri);
      setReportPhase("ready");
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
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(reportUri, { mimeType: "application/pdf" });
      } else {
        setReportError("Sharing is not available on this device. The PDF is saved on your device's app storage.");
      }
    } catch {
      setReportError("Could not open the share sheet for this report.");
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
      <Empty
        title="No generated reports yet"
        message="Completed reports will appear here."
      />
    </Screen>
  );
}
