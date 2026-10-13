import { useState } from "react";
import { Text, View } from "react-native";
import { usePreview } from "@/context/preview-context";
import {
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Heading,
  Notice,
  Orbit,
  PreviewBadge,
  Screen,
  ui,
} from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const examples = {
  appointment: {
    question: "How do I prepare for my appointment?",
    answer:
      "Bring your recent readings and a list of questions. Note when each measurement was taken.",
  },
  reading: {
    question: "What information should I record?",
    answer:
      "Include the measurement, its unit, and the time it was taken. A healthcare professional can help explain what your readings mean for you.",
  },
};
export default function Chatbot() {
  const { preview, setPreview } = usePreview();
  const [example, setExample] = useState<keyof typeof examples>("appointment");
  const sample = examples[example];
  return (
    <Screen>
      <Heading
        title="Pilot AI"
        subtitle="A clearer understanding starts here."
      />
      <Notice>Live chat is not available yet.</Notice>
      <Orbit size={125} />
      <Heading title="What’s on your mind?" />
      {preview ? (
        <>
          <PreviewBadge />
          <View style={[ui.row, { flexWrap: "wrap" }]}>
            <Chip
              selected={example === "reading"}
              onPress={() => setExample("reading")}
            >
              Understand a reading
            </Chip>
            <Chip
              selected={example === "appointment"}
              onPress={() => setExample("appointment")}
            >
              Prepare for a visit
            </Chip>
          </View>
          <Card style={{ marginRight: 22 }}>
            <Text style={ui.body}>
              What would you like to understand today?
            </Text>
          </Card>
          <Card style={{ marginLeft: 30, backgroundColor: C.blue }}>
            <Text style={ui.body}>{sample.question}</Text>
          </Card>
          <Card style={{ marginRight: 22, borderColor: C.primary }}>
            <Text style={ui.body}>{sample.answer}</Text>
            <Text style={ui.small}>Example response · preview only</Text>
          </Card>
        </>
      ) : (
        <>
          <Empty
            title="A place for your questions"
            message="When connected, Pilot AI will help explain your health information."
            icon="sparkles"
          />
          <Button secondary onPress={() => setPreview(true)}>
            Preview a sample conversation
          </Button>
        </>
      )}
      <Field
        label="Ask Pilot AI"
        placeholder="Chat is not available yet"
        editable={false}
      />
      <Button disabled icon="arrow">
        Send message
      </Button>
      <Text style={[ui.small, { textAlign: "center" }]}>
        Educational information, not a diagnosis.
      </Text>
    </Screen>
  );
}
