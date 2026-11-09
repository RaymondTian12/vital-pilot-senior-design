import { AssessmentStatus, type AssessmentTone } from "./assessment-status";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { SavedMetricReading } from "@/types/vitalpilot";
import { readingValue } from "@/services/vital-readings";
import { classificationView } from "@/services/blood-pressure";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { ui } from "./ui";

export function HistoryReading({ reading, unit, children }: { reading: SavedMetricReading; unit: string; children: ReactNode }) {
  const { log_id } = useLocalSearchParams<{ log_id?: string }>();
  const highlighted = String(reading.log_id) === log_id;
  const [open, setOpen] = useState(highlighted);
  const status = reading.metric_type === "BLOOD_PRESSURE" ? classificationView(reading).title : reading.classification?.classification || "Classification unavailable";
  const bp = reading.metric_type === "BLOOD_PRESSURE" ? classificationView(reading) : null;
  const assessment = reading.metric_type !== "BLOOD_PRESSURE" ? reading.classification : null;
  const tone: AssessmentTone = bp ? (bp.critical ? "critical" : bp.tone === "normal" ? "normal" : bp.tone === "warning" ? "warning" : "unknown") : assessment?.next_action === "urgent" ? "critical" : !assessment || assessment.status !== "classified" ? "unknown" : assessment.next_action === "review" || assessment.alert_state.includes("WARNING") ? "warning" : "normal";
  return <View style={{ paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: C.border, ...(highlighted ? { backgroundColor: C.mint } : {}) }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${readingValue(reading)} ${unit}, ${status}, ${new Date(reading.recorded_at).toLocaleString()}`} onPress={() => setOpen(!open)} style={{ minHeight: 48, gap: 6 }}>
      <Text style={ui.heading}>{readingValue(reading)} {unit}</Text>
      <Text style={ui.small}>{new Date(reading.recorded_at).toLocaleString()}</Text>
      <AssessmentStatus title={status} tone={tone} />
      <Text style={ui.link}>{open ? "Hide details" : "View details"}</Text>
    </Pressable>
    {open && children}
  </View>;
}
