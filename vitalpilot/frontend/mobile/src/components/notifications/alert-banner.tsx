import { Pressable, Text, View } from "react-native";
import type { NotificationSeverity } from "@/types/notification";
import { Icon } from "@/components/design/icon";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { ui } from "@/components/design/ui";
type Props = {
  visible: boolean;
  title: string;
  message: string;
  severity: NotificationSeverity;
  onDismiss: () => void;
  onPress?: () => void;
};
export function AlertBanner({
  visible,
  title,
  message,
  severity,
  onDismiss,
  onPress,
}: Props) {
  if (!visible) return null;
  const color =
    severity === "critical"
      ? C.danger
      : severity === "warning"
        ? C.warning
        : C.primaryDark;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[
        ui.card,
        {
          position: "absolute",
          top: 56,
          left: 16,
          right: 16,
          zIndex: 100,
          borderColor: color,
        },
      ]}
    >
      <View style={ui.row}>
        <Icon name="info" color={color} />
        <View style={{ flex: 1 }}>
          <Text style={[ui.heading, { color }]}>{title}</Text>
          <Text style={ui.body}>{message}</Text>
        </View>
      </View>
      <View style={[ui.row, { justifyContent: "space-between" }]}>
        {onPress && (
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={{ paddingVertical: 14, minHeight: 48 }}
          >
            <Text style={ui.link}>View details</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification banner"
          onPress={onDismiss}
          style={{ minHeight: 48, padding: 14 }}
        >
          <Text style={ui.link}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}
