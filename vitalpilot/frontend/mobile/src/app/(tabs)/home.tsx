import { DailySummary } from "@/components/design/daily-summary";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { usePreview } from "@/context/preview-context";
import {
  Button,
  Card,
  Heading,
  PreviewBadge,
  Row,
  Screen,
  ui,
} from "@/components/design/ui";
import { Sparkline, SleepChart } from "@/components/design/charts";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export default function Home() {
  const { user } = useAuth();
  const { preview, setPreview } = usePreview();
  const router = useRouter();
  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Text style={ui.eyebrow}>
          {new Date()
            .toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })
            .toUpperCase()}
        </Text>
        <Heading
          title={`Good morning, ${user?.firstname || "there"}`}
          subtitle="Your health at a glance."
        />
      </View>
      {preview && <PreviewBadge />}
      <Card
        style={{
          backgroundColor: C.primary,
          borderColor: C.primary,
          padding: 22,
        }}
      >
        <Text style={[ui.title, { color: C.white, fontSize: 25 }]}>
          Your daily check-in
        </Text>
        <Text style={[ui.subtitle, { color: "#E5F4F5" }]}>
          Build your picture, one reading at a time.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/metrics")}
          style={{
            backgroundColor: C.white,
            borderRadius: 12,
            padding: 16,
            alignSelf: "flex-start",
            minHeight: 54,
          }}
        >
          <Text style={ui.link}>Log a reading →</Text>
        </Pressable>
      </Card>
      {preview && <Text style={ui.heading}>Latest readings</Text>}
      {preview ? (
        <>
          <View style={[ui.row, { alignItems: "stretch", flexWrap: "wrap" }]}>
            {[
              {
                title: "Blood pressure",
                value: "120/80",
                unit: "mmHg",
                values: [112, 118, 124, 116, 120],
              },
              {
                title: "Blood glucose",
                value: "98",
                unit: "mg/dL",
                values: [94, 102, 98, 96, 98],
              },
            ].map((metric) => (
              <Card key={metric.title} style={{ flex: 1, minWidth: 140 }}>
                <Text style={ui.body}>{metric.title}</Text>
                <Text style={[ui.title, { fontSize: 28 }]}>{metric.value}</Text>
                <Text style={ui.small}>{metric.unit}</Text>
                <Sparkline values={metric.values} />
              </Card>
            ))}
          </View>
          <Text style={ui.heading}>Daily habits</Text>
          <Card>
            <Row
              title="Sleep"
              detail="7.5 hours · sample"
              icon="moon"
              onPress={() => router.push("/metrics?metric=Sleep")}
            />
            <Row
              title="Water"
              detail="5 cups · sample"
              icon="water"
              onPress={() => router.push("/metrics?metric=Water%20Intake")}
            />
          </Card>
          <Card>
            <Text style={ui.heading}>Sleep this week</Text>
            <SleepChart />
          </Card>
        </>
      ) : (
        <>
          <DailySummary />
          <Button secondary onPress={() => setPreview(true)}>
            Preview sample readings
          </Button>
        </>
      )}
      <Card>
        <Row
          title="Explore your tools"
          detail="Tracking, insights, and care"
          icon="grid"
          onPress={() => router.push("/explore")}
        />
        <Row
          title="Find a doctor"
          detail="Search the NPI provider directory"
          icon="doctor"
          onPress={() => router.push("/doctors")}
        />
      </Card>
    </Screen>
  );
}
