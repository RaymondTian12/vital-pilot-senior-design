import { useRouter } from "expo-router";
import { Button, Card, Heading, Screen, ui } from "@/components/design/ui";
import { Text } from "react-native";

export default function DoctorSignUpSuccess() {
  const router = useRouter();
  return <Screen>
    <Heading title="Doctor registration submitted" subtitle="Your account is waiting for verification." />
    <Card>
      <Text style={ui.heading}>What happens next</Text>
      <Text style={ui.body}>The VitalPilot team reviews your identity and active license.</Text>
      <Text style={ui.body}>You can sign in now to check your status. Your patient list becomes available after approval and when a patient shares their records with you.</Text>
    </Card>
    <Button onPress={() => router.replace("/signin?portal=doctor")}>Sign in to check status</Button>
    <Button secondary onPress={() => router.replace("/welcome")}>Back to home</Button>
  </Screen>;
}
