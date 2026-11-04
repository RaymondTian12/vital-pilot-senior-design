import { ReportFeedback, type ReportPhase } from "@/components/design/report-feedback";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { usePreview } from "@/context/preview-context";
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
export default function Reports() {
  const [demoPhase, setDemoPhase] = useState<ReportPhase | null>(null);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (demoTimer.current) clearTimeout(demoTimer.current); }, []);
  function previewCompletion() {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setDemoPhase("generating");
    demoTimer.current = setTimeout(() => setDemoPhase("ready"), 1500);
  }
  const [period, setPeriod] = useState("30 days");
  const { preview, setPreview } = usePreview();
  return (
    <Screen>
      <Heading title="Health reports" subtitle="See the bigger picture." />
      <View style={[ui.row, { flexWrap: "wrap" }]}>
        {["7 days", "30 days", "90 days"].map((value) => (
          <Chip
            key={value}
            selected={period === value}
            onPress={() => setPeriod(value)}
          >
            {value}
          </Chip>
        ))}
      </View>
      <Notice>Report generation and PDF export are not available yet.</Notice>
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
            message="Reports will summarize your saved readings when reporting is connected."
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
      <Button disabled>Generate report</Button>
      <Button disabled secondary>
        Download PDF
      </Button>
      <Text style={ui.heading}>Report history</Text>
      <Empty
        title="No generated reports yet"
        message="Completed reports will appear here."
      />
    </Screen>
  );
}
