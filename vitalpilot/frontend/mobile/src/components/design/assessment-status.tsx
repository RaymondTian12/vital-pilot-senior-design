import { Text, View } from "react-native";
import { ui } from "./ui";
export type AssessmentTone = "normal" | "warning" | "critical" | "unknown";
export function AssessmentStatus({ title, tone }: { title: string; tone: AssessmentTone }) {
  const styles = {
    normal: { color: "#066044", backgroundColor: "#DCFCE7", icon: "✓" },
    warning: { color: "#713F12", backgroundColor: "#FEF3C7", icon: "!" },
    critical: { color: "#991B1B", backgroundColor: "#FEE2E2", icon: "!" },
    unknown: { color: "#334155", backgroundColor: "#E2E8F0", icon: "?" },
  }[tone];
  return <View style={{ backgroundColor: styles.backgroundColor, borderColor: styles.color, borderWidth: 1, borderRadius: 12, padding: 12 }}>
    <Text style={[ui.body, { color: styles.color, fontWeight: "700" }]}>{styles.icon} {title}</Text>
  </View>;
}
