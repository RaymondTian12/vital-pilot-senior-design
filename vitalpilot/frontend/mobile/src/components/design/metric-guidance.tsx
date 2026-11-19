import { SuggestedFollowUpCard } from "./suggested-follow-up";
import { AssessmentStatus } from "./assessment-status";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Linking, Text, View } from "react-native";
import type {
  MetricAssessment,
  SuggestedFollowUp,
  OtherVitalType,
} from "@/types/vitalpilot";
import { Button, ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export function MetricGuidance({
  assessment,
  metricType,
  onCompleteContext,
  followUp,
  onFindCare,
  showActions = true,
}: {
  assessment?: MetricAssessment | null;
  metricType?: OtherVitalType;
  onCompleteContext?: () => void;
  followUp?: SuggestedFollowUp | null;
  onFindCare?: () => void;
  showActions?: boolean;
}) {
  const router = useRouter();
  const missingContext = assessment?.status === "needs_context";
  const missingGoal = missingContext && assessment.category === "goal";
  const missingPersonalBest = missingContext && metricType === "PEAK_FLOW_RATE";
  const missingGlucoseContext =
    missingContext && metricType === "BLOOD_GLUCOSE";
  const openGoals = () => {
    onFindCare?.();
    router.push("/goals");
  };
  const [callError, setCallError] = useState("");
  const urgent = assessment?.next_action === "urgent";
  const review = assessment?.next_action === "review";
  return (
    <View style={{ gap: 9, marginTop: 8 }}>
      <AssessmentStatus
        title={assessment?.classification || "Classification unavailable"}
        tone={
          urgent
            ? "critical"
            : !assessment || assessment.status !== "classified"
              ? "unknown"
              : assessment.alert_state.includes("WARNING") || review
                ? "warning"
                : "normal"
        }
      />
      <Text style={ui.body}>
        {assessment?.guidance ||
          "This saved value has no clinical assessment yet. This does not mean the reading is normal or clear."}
      </Text>
      {!!assessment && <Text style={ui.small}>{assessment.basis}</Text>}
      {urgent && (
        <Text style={[ui.body, { color: C.danger }]}>
          For severe symptoms, trouble breathing, fainting, or confusion, call
          your local emergency number now. In the U.S., call 911. Do not wait
          for a routine doctor appointment.
        </Text>
      )}
      {showActions && urgent && (
        <Button
          onPress={() =>
            void Linking.openURL("tel:911").catch(() =>
              setCallError(
                "Couldn’t open the dialer. Call your local emergency number directly.",
              ),
            )
          }
        >
          Call 911 (U.S.)
        </Button>
      )}
      {!!callError && (
        <Text accessibilityRole="alert" style={{ color: C.danger }}>
          {callError}
        </Text>
      )}
      {showActions &&
        (missingGoal || missingPersonalBest || missingGlucoseContext) && (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Text accessibilityRole="header" style={ui.heading}>
              Next step
            </Text>
            {missingGlucoseContext ? (
              <>
                <Text style={ui.small}>
                  For a new reading, select the context that actually applies.
                  Existing saved readings keep their original context.
                </Text>
                <Button
                  secondary
                  onPress={
                    onCompleteContext ??
                    (() => {
                      onFindCare?.();
                      router.push({
                        pathname: "/metrics",
                        params: { metric: "Blood Glucose" },
                      });
                    })
                  }
                >
                  Enter a reading with context
                </Button>
              </>
            ) : (
              <>
                <Text style={ui.small}>
                  Save your settings, then enter a new reading to use them.
                  Existing saved readings keep their original assessment.
                </Text>
                <Button secondary onPress={openGoals}>
                  {missingPersonalBest
                    ? "Set peak-flow personal best"
                    : "Set personal goal"}
                </Button>
              </>
            )}
          </View>
        )}
      {/* Missing context is explained above; do not repeat it as a care recommendation. */}
      {showActions && followUp?.status !== "needs_context" && (
        <SuggestedFollowUpCard
          followUp={followUp}
          beforeNavigate={onFindCare}
        />
      )}
      {assessment?.source_url?.startsWith("https://") && (
        <Text
          accessibilityRole="link"
          style={ui.link}
          onPress={() =>
            void Linking.openURL(assessment.source_url!).catch(() => {})
          }
        >
          Measurement guidance
        </Text>
      )}
    </View>
  );
}
