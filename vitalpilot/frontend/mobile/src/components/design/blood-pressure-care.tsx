import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { Button, ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

export function BloodPressureCare({ critical, onFindCare }: {
  critical: boolean;
  onFindCare: (specialty: "Primary care" | "Cardiology") => void;
}) {
  const [callError, setCallError] = useState("");
  return (
    <View style={{ marginTop: 12, padding: 16, borderWidth: 1, borderColor: critical ? C.danger : C.border, borderRadius: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={[ui.heading, { color: critical ? C.danger : C.title }]}>{critical ? "Get medical help promptly" : "Plan your follow-up"}</Text>
      {critical ? <>
        <Text style={ui.body}>If this is a current reading and you have chest pain, shortness of breath, weakness, numbness, vision changes, back pain, or trouble speaking, call 911 in the U.S. or your local emergency number now. Don’t wait for an appointment.</Text>
        <Button onPress={() => { void Linking.openURL("tel:911").catch(() => setCallError("Couldn’t open the dialer. Call 911 directly in the U.S., or your local emergency number.")); }}>Call 911 (U.S.)</Button>
        {!!callError && <Text accessibilityRole="alert" style={{ color: C.danger }}>{callError}</Text>}
        <Text style={ui.body}>Without these symptoms, wait at least one minute and check again. If it remains above 180 systolic or 120 diastolic, contact your healthcare professional immediately.</Text>
        <Text style={ui.small}>The directory below is for follow-up care. It does not provide emergency services or confirm appointment availability.</Text>
      </> : <Text style={ui.body}>Discuss repeated elevated readings with your healthcare professional. Search primary care providers or cardiologists in your city for follow-up.</Text>}
      <Button secondary onPress={() => onFindCare("Primary care")}>Find primary care</Button>
      <Button secondary onPress={() => onFindCare("Cardiology")}>Find a cardiologist</Button>
      <Text style={ui.small} onPress={() => void Linking.openURL("https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/hypertensive-crisis-when-you-should-call-911-for-high-blood-pressure").catch(() => {})} accessibilityRole="link">Guidance: American Heart Association</Text>
    </View>
  );
}
