import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Heading, Notice, Screen, ui } from "@/components/design/ui";

const patients = [
  { id: 1, name: "Jordan Lee", dateOfBirth: "May 14, 1982" },
  { id: 2, name: "Sam Taylor", dateOfBirth: "September 8, 1975" },
];

export default function DoctorPortalPreview() {
  const router = useRouter();
  const { patient: selectedId } = useLocalSearchParams<{ patient?: string }>();
  const selected = patients.find((patient) => String(patient.id) === selectedId);
  if (selected) return <Screen brand={false}>
    <Heading title={selected.name} subtitle="Readings shared by this patient" />
    <Notice>Sample preview with fictional readings.</Notice>
    <Card><Text style={ui.heading}>Blood pressure</Text><Text style={ui.small}>October 30, 2026</Text><Text style={ui.body}>Systolic (mmHg): 122</Text><Text style={ui.body}>Diastolic (mmHg): 78</Text></Card>
    <Card><Text style={ui.heading}>Blood oxygen</Text><Text style={ui.small}>October 29, 2026</Text><Text style={ui.body}>Blood oxygen (%): 98</Text></Card>
    <Button secondary onPress={() => router.replace("/doctor-portal-preview")}>Back to patients</Button>
  </Screen>;
  return <Screen brand={false}>
    <Heading title="Doctor portal" subtitle="Welcome, Dr. Morgan" />
    <Notice>Sample preview with fictional patients. The live portal shows only patients who currently share their records with you.</Notice>
    {patients.map((patient) => <Card key={patient.id}>
      <Text style={ui.heading}>{patient.name}</Text>
      <Text style={ui.small}>Date of birth: {patient.dateOfBirth}</Text>
      <Button onPress={() => router.push({ pathname: "/doctor-portal-preview", params: { patient: String(patient.id) } })}>View records</Button>
    </Card>)}
    <Button secondary onPress={() => router.replace("/welcome")}>Back to sign in</Button>
  </Screen>;
}
