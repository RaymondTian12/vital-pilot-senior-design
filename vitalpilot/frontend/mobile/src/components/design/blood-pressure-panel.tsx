import { useCallback } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useBloodPressure } from "@/context/blood-pressure-context";
import { useAuth } from "@/context/auth-context";
import { classificationView } from "@/services/blood-pressure";
import type { BloodPressureReading } from "@/types/vitalpilot";
import { Button, Card, ui } from "./ui";
import { Sparkline } from "./charts";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export function ReadingResult({ reading }: { reading: BloodPressureReading }) {
  const view = classificationView(reading);
  const color =
    view.critical || view.tone === "critical"
      ? C.danger
      : view.tone === "normal"
        ? C.primaryDark
        : C.warning;
  return (
    <View style={{ gap: 7 }}>
      <Text style={[ui.heading, { fontVariant: ["tabular-nums"] }]}>
        {reading.systolic_mmhg}/{reading.diastolic_mmhg}{" "}
        <Text style={ui.small}>mmHg</Text>
      </Text>
      <Text style={ui.small}>
        {new Date(reading.recorded_at).toLocaleString()}
      </Text>
      <Text style={[ui.body, { color, fontWeight: "700" }]}>{view.title}</Text>
      {view.tone === "unknown" && (
        <Text style={ui.small}>
          One or both values could not be classified. This is not a normal/clear
          result.
        </Text>
      )}
      {view.messages.map((message) => (
        <Text key={message} style={[ui.small, { color }]}>
          {message}
        </Text>
      ))}
    </View>
  );
}
export function BloodPressurePanel({ compact = false }: { compact?: boolean }) {
  const bp = useBloodPressure();
  const { signOut } = useAuth();
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      void bp.refresh();
    }, [bp.refresh]),
  );
  const latest = bp.records[0];
  const chronological = [...bp.records].reverse();
  return (
    <Card>
      <Text accessibilityRole="header" style={ui.heading}>
        {compact ? "Latest blood pressure" : "Your blood-pressure history"}
      </Text>
      {bp.loading && (
        <Text accessibilityLiveRegion="polite" style={ui.small}>
          {latest ? "Refreshing readings…" : "Loading readings…"}
        </Text>
      )}
      {!!bp.error && (
        <Text accessibilityRole="alert" style={[ui.body, { color: C.danger }]}>
          {bp.error}
        </Text>
      )}
      {bp.authExpired ? (
        <Button onPress={() => void signOut()}>Sign in again</Button>
      ) : (
        <Button
          secondary
          disabled={bp.loading || bp.saving}
          onPress={() => void bp.refresh()}
        >
          Refresh readings
        </Button>
      )}
      {bp.uncertain && (
        <View style={{ gap: 8 }}>
          <Text style={ui.body}>
            A previous save may have completed. Review the refreshed history
            below. Retry only if that reading is missing.
          </Text>
          <Button
            secondary
            disabled={!bp.retryReady || bp.loading}
            onPress={bp.allowRetry}
          >
            I checked history — enable retry
          </Button>
        </View>
      )}
      {!latest && bp.loaded && !bp.loading && !bp.error && (
        <Text style={ui.body}>
          No blood-pressure readings yet. Log your first reading to start your
          history.
        </Text>
      )}
      {(compact ? bp.records.slice(0, 1) : bp.records).map((reading) => (
        <View
          key={reading.log_id}
          style={{
            paddingVertical: 12,
            borderBottomColor: C.border,
            borderBottomWidth: 1,
          }}
        >
          <ReadingResult reading={reading} />
        </View>
      ))}
      {chronological.length >= 2 && (
        <View style={{ gap: 12 }}>
          <Text style={ui.small}>Recent readings, oldest to newest · mmHg</Text>
          <View
            accessible
            accessibilityLabel={`Systolic readings: ${chronological.map((r) => r.systolic_mmhg).join(", ")} mmHg`}
          >
            <Text style={ui.small}>Systolic</Text>
            <Sparkline values={chronological.map((r) => r.systolic_mmhg)} />
          </View>
          <View
            accessible
            accessibilityLabel={`Diastolic readings: ${chronological.map((r) => r.diastolic_mmhg).join(", ")} mmHg`}
          >
            <Text style={ui.small}>Diastolic</Text>
            <Sparkline
              values={chronological.map((r) => r.diastolic_mmhg)}
              color={C.textSecondary}
            />
          </View>
        </View>
      )}
      {compact ? (
        <Button onPress={() => router.push("/metrics?metric=Blood%20Pressure")}>
          Log blood pressure
        </Button>
      ) : (
        bp.more && (
          <Button
            secondary
            disabled={bp.loading || bp.saving}
            onPress={() => void bp.loadMore()}
          >
            Load more readings
          </Button>
        )
      )}
    </Card>
  );
}
