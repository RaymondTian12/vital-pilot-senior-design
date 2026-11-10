import { Text, View } from "react-native";
import { Icon, type IconName } from "./icon";
import { ui } from "./ui";
export type AssessmentTone = "normal" | "warning" | "critical" | "unknown";
export function AssessmentStatus({ title, tone }: { title: string; tone: AssessmentTone }) {
  const styles: Record<AssessmentTone, { color: string; backgroundColor: string; icon: IconName }> = {
    normal: { color: "#066044", backgroundColor: "#DCFCE7", icon: "check-circle" },
    warning: { color: "#713F12", backgroundColor: "#FEF3C7", icon: "alert-triangle" },
    critical: { color: "#991B1B", backgroundColor: "#FEE2E2", icon: "alert-triangle" },
    unknown: { color: "#334155", backgroundColor: "#E2E8F0", icon: "help-circle" },
  };
  const style = styles[tone];
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: style.backgroundColor, borderColor: style.color, borderWidth: 1, borderRadius: 12, padding: 12 }}>
    <Icon name={style.icon} color={style.color} size={18} />
    <Text style={[ui.body, { color: style.color, fontWeight: "700", flex: 1 }]}>{title}</Text>
  </View>;
}
