import { useCallback, useEffect, useState } from "react";
import { InteractionManager, Text, View, type StyleProp, type TextStyle } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, ApiError, type ReportPreviewData } from "@/services/api";
import { Button, Card, Heading, Notice, Screen, ui } from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

const SEVERITY_STYLE = {
  URGENT: { background: "#FDECEA", text: C.danger },
  WARNING: { background: C.warningBackground, text: C.warning },
} as const;

function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
}

function formatNumber(value: number): string {
  return parseFloat(value.toFixed(1)).toString();
}

// Long single-string paragraphs can silently lose their final wrapped line
// on-device (a known RN Text layout issue with very long content). Splitting
// into nested per-sentence Text fragments keeps the same inline paragraph
// flow while sidestepping the bug, since each fragment is measured on its
// own rather than one very long string.
function sentenceFragments(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]*\s*/g);
  return matches && matches.length > 0 ? matches : [text];
}

function Paragraph({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={style}>
      {sentenceFragments(text).map((sentence, index) => (
        <Text key={index}>{sentence}</Text>
      ))}
    </Text>
  );
}

export default function ReportPreview() {
  const params = useLocalSearchParams<{ id: string }>();
  const reportId = Number(params.id);

  const [data, setData] = useState<ReportPreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Mounting the long narrative text right as the push-navigation transition
  // is still animating has caused the scroll container to mismeasure it on
  // real devices (losing the last wrapped line). Hold the heavy content
  // until the transition has actually settled.
  const [transitionDone, setTransitionDone] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(reportId) || reportId <= 0) {
      setError("This report link isn't valid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await api.getReportPreview(reportId));
    } catch (e: unknown) {
      setData(null);
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Failed to load this report.",
      );
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setTransitionDone(true));
    return () => task.cancel();
  }, []);

  if (loading || !transitionDone) {
    return (
      <Screen back brand={false}>
        <Heading title="Health report" subtitle="Loading your report…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen back brand={false}>
        <Heading title="Health report" />
        <Notice error>{error ?? "This report could not be loaded."}</Notice>
        <Button secondary onPress={() => void load()}>Try again</Button>
      </Screen>
    );
  }

  return (
    <Screen back brand={false}>
      <Heading
        title={`${data.period_label} health report`}
        subtitle={`${data.start_date} to ${data.end_date}`}
      />

      <Card>
        <Text style={ui.heading}>{data.patient.name}</Text>
        <Text style={ui.small}>
          {data.patient.age} years old · {data.patient.sex}
        </Text>
        <Text style={ui.small}>Date of birth: {data.patient.dob}</Text>
        <Text style={ui.small}>Height: {data.patient.height_in.toFixed(1)} in</Text>
        <Text style={ui.small}>
          Most recent weight:{" "}
          {data.patient.latest_weight_lbs != null
            ? `${data.patient.latest_weight_lbs.toFixed(1)} lbs`
            : "Not recorded"}
        </Text>
      </Card>

      <Card>
        <Text style={ui.heading}>History of present illness</Text>
        <Paragraph text={data.narrative.hpi} style={ui.body} />
        {data.previous_report && (
          <Text style={[ui.small, { fontStyle: "italic" }]}>
            Prior report on file: {data.previous_report.start_date} to{" "}
            {data.previous_report.end_date}.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={ui.heading}>Tracked metrics this period</Text>
        {data.metrics.map((metric) => {
          const fieldEntries = Object.entries(metric.fields);
          return (
            <View
              key={metric.metric_type}
              style={{
                gap: 2,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Text style={[ui.body, { fontWeight: "600" }]}>{metric.label}</Text>
              {metric.count === 0 ? (
                <Text style={ui.small}>No readings logged</Text>
              ) : (
                <Text style={ui.small}>
                  {metric.count} reading{metric.count === 1 ? "" : "s"} · range{" "}
                  {fieldEntries
                    .map(([, stat]) => `${formatNumber(stat.min)}-${formatNumber(stat.max)}`)
                    .join(", ")}{" "}
                  {metric.unit} · avg{" "}
                  {fieldEntries.map(([, stat]) => formatNumber(stat.avg)).join(", ")}
                </Text>
              )}
            </View>
          );
        })}
      </Card>

      <Card>
        <Text style={ui.heading}>Notable alerts</Text>
        {data.alerts.length === 0 ? (
          <Text style={[ui.body, { flexShrink: 1 }]}>
            No urgent or warning alerts were triggered during this period.
          </Text>
        ) : (
          data.alerts.map((alert, index) => {
            const style = SEVERITY_STYLE[alert.severity];
            return (
              <View
                key={`${alert.metric_type}-${alert.recorded_at}-${index}`}
                style={{
                  backgroundColor: style.background,
                  borderRadius: 12,
                  padding: 12,
                  gap: 2,
                }}
              >
                <Text style={[ui.small, { color: C.textSecondary }]}>
                  {formatDateTime(alert.recorded_at)}
                </Text>
                <Text style={{ fontWeight: "700", color: style.text }}>
                  {alert.metric_type.replace(/_/g, " ")}: {alert.classification}
                </Text>
              </View>
            );
          })
        )}
      </Card>

      <Card>
        <Text style={ui.heading}>Summary</Text>
        <Paragraph text={data.narrative.summary} style={ui.body} />
      </Card>

      <Notice>
        The History of Present Illness and Summary above were drafted by an AI model from this
        patient's logged data. They are not written or reviewed by a clinician. This report is
        not a medical diagnosis — discuss these results with a licensed healthcare professional.
      </Notice>
    </Screen>
  );
}
