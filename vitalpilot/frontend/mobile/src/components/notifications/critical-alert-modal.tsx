import { Linking, Modal, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { Button, Notice, ui } from "@/components/design/ui";
import { Icon } from "@/components/design/icon";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
type Props = {
  visible: boolean;
  title: string;
  message: string;
  recommendation?: string;
  onDismiss: () => void;
  onReviewMeasurement?: () => void;
};
export function CriticalAlertModal({
  visible,
  title,
  message,
  recommendation,
  onDismiss,
  onReviewMeasurement,
}: Props) {
  const [error, setError] = useState("");
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(20,42,53,0.65)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <ScrollView
          accessibilityViewIsModal
          contentContainerStyle={{
            gap: 16,
            padding: 24,
            backgroundColor: C.white,
            borderRadius: 20,
          }}
          style={{
            flexGrow: 0,
            maxHeight: "85%",
            width: "100%",
            maxWidth: 480,
            alignSelf: "center",
          }}
        >
          <Icon name="info" color={C.danger} size={40} />
          <Text style={[ui.eyebrow, { color: C.danger }]}>
            CRITICAL HEALTH ALERT
          </Text>
          <Text accessibilityRole="header" style={ui.title}>
            {title}
          </Text>
          <Text accessibilityRole="alert" style={ui.body}>
            {message}
          </Text>
          {recommendation && <Notice error>{recommendation}</Notice>}
          <Text style={ui.subtitle}>
            If you believe you are experiencing an emergency, contact your local
            emergency services.
          </Text>
          {error && <Notice error>{error}</Notice>}
          <Button
            onPress={async () => {
              try {
                await Linking.openURL("tel:911");
              } catch {
                setError(
                  "Unable to open the dialer. Contact emergency services directly.",
                );
              }
            }}
          >
            Call 911
          </Button>
          {onReviewMeasurement && (
            <Button secondary onPress={onReviewMeasurement}>
              Review measurement
            </Button>
          )}
          <Button secondary onPress={onDismiss}>
            I understand
          </Button>
          <Text style={ui.small}>
            VitalPilot provides informational support and does not replace
            professional medical judgment.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
