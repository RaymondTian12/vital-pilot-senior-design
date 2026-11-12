import { Text, View, type StyleProp, type TextStyle } from "react-native";
import type { ReportPreviewData } from "@/services/api";
import { Card, ui } from "@/components/design/ui";
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

function Paragraph({
  text,
  style,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={style}>
      {sentenceFragments(text).map((sentence, index) => (
        <Text key={index}>{sentence}</Text>
      ))}
    </Text>
  );
}

/** Renders a report's content (patient header, HPI, tracked metrics, alerts,
 * summary) as a stack of Cards. Shared between the real report-preview
 * screen and the sample preview on the Reports tab so both always look
 * identical -- the sample is a realistic preview of this exact layout, not
 * a lookalike that can drift from it. */
export function ReportPreviewBody({ data }: { data: ReportPreviewData }) {
  return (
    <>
      <Card>
        <Text style={ui.heading}>{data.patient.name}</Text>
        <Text style={ui.small}>
          {data.patient.age} years old · {data.patient.sex}
        </Text>
        <Text style={ui.small}>Date of birth: {data.patient.dob}</Text>
        <Text style={ui.small}>
          Height: {data.patient.height_in.toFixed(1)} in
        </Text>
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
              <Text style={[ui.body, { fontWeight: "600" }]}>
                {metric.label}
              </Text>
              {metric.count === 0 ? (
                <Text style={ui.small}>No readings logged</Text>
              ) : (
                <Text style={ui.small}>
                  {metric.count} reading{metric.count === 1 ? "" : "s"} · range{" "}
                  {fieldEntries
                    .map(
                      ([, stat]) =>
                        `${formatNumber(stat.min)}-${formatNumber(stat.max)}`,
                    )
                    .join(", ")}{" "}
                  {metric.unit} · avg{" "}
                  {fieldEntries
                    .map(([, stat]) => formatNumber(stat.avg))
                    .join(", ")}
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
        {data.ai_status === "not_requested" && (
          <Text style={ui.small}>
            Saved-data report · no AI explanation requested
          </Text>
        )}
        {data.ai_status === "unavailable" && (
          <Text style={ui.small}>
            AI explanation unavailable · saved readings remain available
          </Text>
        )}
        <Text style={ui.heading}>Summary</Text>
        <Paragraph text={data.narrative.summary} style={ui.body} />
      </Card>
    </>
  );
}
