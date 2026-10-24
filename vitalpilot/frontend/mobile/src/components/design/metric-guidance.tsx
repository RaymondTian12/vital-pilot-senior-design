import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { MetricAssessment } from "@/types/vitalpilot";
import { Button, ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export function MetricGuidance({ assessment, onFindCare, showActions = true }: {
  assessment?: MetricAssessment | null;
  onFindCare?: () => void;
  showActions?: boolean;
}) {
  const router = useRouter();
  const [callError, setCallError] = useState("");
  const urgent = assessment?.next_action === "urgent";
  const review = assessment?.next_action === "review";
  const color = urgent ? C.danger : assessment?.alert_state.includes("WARNING") || assessment?.status !== "classified" ? C.warning : C.primaryDark;
  return <View style={{ gap: 9, marginTop: 8 }}>
    <Text style={[ui.heading, { color }]}>{assessment?.classification || "Classification unavailable"}</Text>
    <Text style={ui.body}>{assessment?.guidance || "This saved value has no clinical assessment yet. This does not mean the reading is normal or clear."}</Text>
    {!!assessment && <Text style={ui.small}>{assessment.basis}</Text>}
    {urgent && <Text style={[ui.body, { color: C.danger }]}>For severe symptoms, trouble breathing, fainting, or confusion, call your local emergency number now. In the U.S., call 911. Do not wait for a routine doctor appointment.</Text>}
    {showActions && urgent && <Button onPress={() => void Linking.openURL("tel:911").catch(() => setCallError("Couldn’t open the dialer. Call your local emergency number directly."))}>Call 911 (U.S.)</Button>}
    {!!callError && <Text accessibilityRole="alert" style={{ color: C.danger }}>{callError}</Text>}
    {showActions && assessment?.category === "health" && (urgent || review) && <Button secondary onPress={onFindCare ?? (() => router.push({ pathname: "/doctors", params: { specialty: "Primary care", reason: "metric-review" } }))}>Find a doctor for follow-up</Button>}
    {assessment?.source_url?.startsWith("https://") && <Text accessibilityRole="link" style={ui.link} onPress={() => void Linking.openURL(assessment.source_url!).catch(() => {})}>Measurement guidance</Text>}
  </View>;
}
