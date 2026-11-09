import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/services/api";
import { session } from "@/services/session";
import { historyWindow, type HistoryPeriod } from "@/services/metric-history";
import type {
  ChatContext,
  ChatContextSelection,
  VitalType,
} from "@/types/vitalpilot";
import { Button, Card, Chip, ui } from "./ui";
import { vitals } from "./vitals-data";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

export const metricName = (kind: VitalType) =>
  Object.entries(vitals).find(([, value]) => value.type === kind)?.[0] ?? kind;
const number = (value: number) => Number(value.toFixed(2)).toLocaleString();
const fieldName = (key: string) =>
  ({
    systolic_mmhg: "Systolic (mmHg)",
    diastolic_mmhg: "Diastolic (mmHg)",
    glucose_mgdl: "Glucose (mg/dL)",
    spo2_percentage: "Oxygen (%)",
    weight_lbs: "Weight (lb)",
    bmi_value: "BMI (kg/m²)",
    flow_rate_lmin: "Peak flow (L/min)",
    duration_hours: "Sleep (hours)",
    amount_cups: "Water (cups)",
    steps_taken: "Activity (steps)",
  })[key] ?? key;

export function ChatReadingSummary({ context }: { context: ChatContext }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={ui.small}>
        {new Date(context.start_at).toLocaleDateString()} –{" "}
        {new Date(new Date(context.end_at).getTime() - 1).toLocaleDateString()}{" "}
        · {context.timezone_name}
      </Text>
      {context.metrics.map((metric) => (
        <View key={metric.metric} style={{ gap: 4 }}>
          <Text style={ui.title}>{metricName(metric.metric)}</Text>
          {!metric.latest ? (
            <Text style={ui.body}>No saved readings in this period.</Text>
          ) : (
            <>
              <Text style={ui.body}>
                Latest:{" "}
                {Object.entries(metric.latest.values)
                  .filter(([, value]) => value != null)
                  .map(([key, value]) => `${fieldName(key)}: ${number(value!)}`)
                  .join(" · ")}
              </Text>
              <Text style={ui.small}>
                {new Date(metric.latest.recorded_at).toLocaleString()} ·{" "}
                {metric.latest.assessment}
              </Text>
              {!!metric.latest.guidance && (
                <Text style={ui.small}>{metric.latest.guidance}</Text>
              )}
            </>
          )}
          {Object.entries(metric.summary.values).map(([field, stats]) => (
            <Text key={field} style={ui.small}>
              {fieldName(field)}: average {number(stats.avg)}, range{" "}
              {number(stats.min)}–{number(stats.max)}
            </Text>
          ))}
          {metric.assessment_counts.map((item) => (
            <Text key={`${item.label}:${item.alert_state}`} style={ui.small}>
              Period assessment: {item.label} · {item.count}
            </Text>
          ))}
          <Text style={ui.small}>
            {metric.summary.count} observations / daily snapshots ·{" "}
            {metric.summary.days_logged} days logged
          </Text>
        </View>
      ))}
      <Text style={ui.small}>{context.note}</Text>
      <Text style={ui.small}>
        Summary checked {new Date(context.generated_at).toLocaleString()}.
      </Text>
    </View>
  );
}

export function ChatReadings({
  onClose,
  onShare,
}: {
  onClose: () => void;
  onShare: (selection: ChatContextSelection, context: ChatContext) => void;
}) {
  const [days, setDays] = useState<HistoryPeriod>(7);
  const [selected, setSelected] = useState<VitalType[]>([]);
  const [preview, setPreview] = useState<{
    selection: ChatContextSelection;
    data: ChatContext;
  }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const revision = useRef(0);
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  function invalidate() {
    revision.current++;
    setPreview(undefined);
    setError("");
    setBusy(false);
  }
  async function load() {
    const id = ++revision.current,
      version = session.version();
    const window = historyWindow(days);
    const selection = {
      metric_types: selected,
      start_at: window.start_at,
      end_at: window.end_at,
      timezone_name: window.timezone_name,
    };
    setBusy(true);
    setError("");
    try {
      const data = await api.chatContext(selection);
      if (id === revision.current && version === session.version())
        setPreview({ selection, data });
    } catch (cause) {
      if (id === revision.current && version === session.version())
        setError(
          cause instanceof Error
            ? cause.message
            : "Couldn’t load readings. Retry or close to chat without readings.",
        );
    } finally {
      if (id === revision.current) setBusy(false);
    }
  }
  return (
    <Modal
      visible
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            gap: 16,
            maxWidth: 640,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <Text accessibilityRole="header" style={ui.heading}>
            Share saved readings
          </Text>
          <Text style={ui.body}>
            Choose what Pilot AI can see. Nothing is sent to Gemini until you
            send a chat message.
          </Text>
          <View style={[ui.row, { flexWrap: "wrap" }]}>
            {([7, 30, 90] as const).map((value) => (
              <Chip
                key={value}
                selected={days === value}
                onPress={() => {
                  invalidate();
                  setDays(value);
                }}
              >
                {value} days
              </Chip>
            ))}
          </View>
          <View style={[ui.row, { flexWrap: "wrap" }]}>
            {Object.entries(vitals).map(([name, metric]) => (
              <Chip
                key={name}
                selected={selected.includes(metric.type)}
                onPress={() => {
                  invalidate();
                  setSelected((current) =>
                    current.includes(metric.type)
                      ? current.filter((kind) => kind !== metric.type)
                      : [...current, metric.type],
                  );
                }}
              >
                {name}
              </Chip>
            ))}
          </View>
          <Button
            disabled={!selected.length || busy}
            onPress={() => void load()}
          >
            {busy ? "Loading saved readings…" : "Preview selected readings"}
          </Button>
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={[ui.body, { color: C.danger }]}
            >
              {error}
            </Text>
          )}
          {preview && (
            <Card>
              <ChatReadingSummary context={preview.data} />
              <Text style={ui.body}>
                Sharing allows selected health summaries and conversation text
                to be sent to Google Gemini. Your account name and email are
                excluded. AI can make mistakes. Readings are fetched again when
                you send, so the summary may change.
              </Text>
              <Button onPress={() => onShare(preview.selection, preview.data)}>
                Share with Gemini
              </Button>
            </Card>
          )}
          <Button secondary onPress={onClose}>
            Close
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
