import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { usePreview } from "@/context/preview-context";
import {
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Heading,
  Notice,
  PreviewBadge,
  Row,
  Screen,
  ui,
} from "@/components/design/ui";
const metrics = {
  "Blood Pressure": {
    primary: "Systolic (mmHg)",
    secondary: "Diastolic (mmHg)",
    example: "120/80 mmHg",
  },
  "Blood Glucose": {
    primary: "Glucose (mg/dL)",
    secondary: "",
    example: "98 mg/dL",
  },
  "Blood Oxygen": {
    primary: "Oxygen saturation (%)",
    secondary: "",
    example: "98%",
  },
  "Peak Flow": {
    primary: "Peak flow (L/min)",
    secondary: "",
    example: "450 L/min",
  },
  Sleep: {
    primary: "Sleep duration (hours)",
    secondary: "",
    example: "7.5 hours",
  },
  "Physical Activity": {
    primary: "Steps",
    secondary: "",
    example: "6,200 steps",
  },
  "Water Intake": { primary: "Water (cups)", secondary: "", example: "5 cups" },
  Weight: { primary: "Weight (lb)", secondary: "", example: "150 lb" },
} as const;
type Metric = keyof typeof metrics;
export default function Metrics() {
  const { metric } = useLocalSearchParams<{ metric?: string }>();
  const [selected, setSelected] = useState<Metric>(
    metric && metric in metrics ? (metric as Metric) : "Blood Pressure",
  );
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const { preview, setPreview } = usePreview();
  const config = metrics[selected];
  return (
    <Screen>
      <Heading title="Vitals" subtitle="Record what matters." />
      <Notice>
        Measurement saving is not available yet. Values entered here are not
        saved.
      </Notice>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {(Object.keys(metrics) as Metric[]).map((name) => (
          <Chip
            key={name}
            selected={name === selected}
            onPress={() => {
              setSelected(name);
              setPrimary("");
              setSecondary("");
            }}
          >
            {name}
          </Chip>
        ))}
      </ScrollView>
      <Card>
        <Text style={ui.heading}>{selected}</Text>
        <Text style={ui.subtitle}>Enter your latest reading.</Text>
        <View style={[ui.row, { alignItems: "flex-start", flexWrap: "wrap" }]}>
          <Field
            label={config.primary}
            value={primary}
            onChangeText={setPrimary}
            keyboardType="decimal-pad"
            placeholder="Enter value"
          />
          {config.secondary ? (
            <Field
              label={config.secondary}
              value={secondary}
              onChangeText={setSecondary}
              keyboardType="decimal-pad"
              placeholder="Enter value"
            />
          ) : null}
        </View>
        <Row
          title="Today"
          detail="Time will be recorded when saving is available"
          icon="calendar"
        />
        <Button disabled>Save measurement</Button>
        <Text style={ui.small}>Your reading has not been saved.</Text>
      </Card>
      <Text style={ui.heading}>Recent measurements</Text>
      {preview ? (
        <Card>
          <PreviewBadge />
          <Row
            title={selected}
            detail={`${config.example} · example, not a saved record`}
            icon="vitals"
          />
        </Card>
      ) : (
        <>
          <Empty
            title="No saved readings yet"
            message="Your measurements will appear here once health tracking is connected."
            icon="vitals"
          />
          <Button secondary onPress={() => setPreview(true)}>
            Preview sample readings
          </Button>
        </>
      )}
    </Screen>
  );
}
