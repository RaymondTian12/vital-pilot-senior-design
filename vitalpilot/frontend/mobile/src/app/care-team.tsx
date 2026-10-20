import { useEffect, useRef, useState } from "react";
import { Linking, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { Button, Card, Empty, Heading, Notice, Screen, ui } from "@/components/design/ui";

type Provider = { provider_id: number; npi: string; first_name: string; last_name: string; specialty: string; license_state: string; clinic_name: string | null; phone: string | null };
export default function CareTeam() {
  const params = useLocalSearchParams<{ specialty?: string }>();
  const [specialty, setSpecialty] = useState(params.specialty ?? "");
  const [doctors, setDoctors] = useState<Provider[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const id = ++generation.current;
    setBusy(true); setError(""); setDoctors([]);
    api.getCareTeam(specialty).then((result) => {
      if (generation.current === id) setDoctors(result.doctors);
    }).catch((e) => {
      if (generation.current === id) setError(e instanceof Error ? e.message : "Unable to load your care directory.");
    }).finally(() => { if (generation.current === id) setBusy(false); });
    return () => { generation.current++; };
  }, [specialty, attempt]);
  return <Screen back>
    <Heading title="VitalPilot care directory" subtitle={specialty ? `${specialty} providers registered with VitalPilot` : "Providers registered with VitalPilot"} />
    <Notice>Contact a provider to confirm location, availability, insurance, and whether they can help with your concern. This directory is for follow-up care, not emergency care.</Notice>
    {busy && <Text accessibilityLiveRegion="polite" style={ui.body}>Loading providers…</Text>}
    {!!error && <><Text accessibilityRole="alert" style={ui.body}>{error}</Text><Button onPress={() => setAttempt((n) => n + 1)}>Try again</Button></>}
    {!busy && !error && doctors.length === 0 && <Empty title="No matching providers yet" message="There are no registered providers matching this filter in the VitalPilot database. Contact your usual healthcare professional for follow-up." />}
    {!!specialty && <Button secondary onPress={() => setSpecialty("")}>View all VitalPilot providers</Button>}
    {doctors.map((doctor) => <Card key={doctor.provider_id}>
      <Text style={ui.heading}>{doctor.first_name} {doctor.last_name}</Text>
      <Text style={ui.body}>{doctor.specialty}</Text>
      {!!doctor.clinic_name && <Text style={ui.body}>{doctor.clinic_name}</Text>}
      <Text style={ui.small}>License state: {doctor.license_state} · NPI: {doctor.npi}</Text>
      {doctor.phone ? <><Text style={ui.body}>{doctor.phone}</Text><Button secondary onPress={() => void Linking.openURL(`tel:${doctor.phone!.replace(/[^\d+]/g, "")}`).catch(() => setError("Couldn’t open the dialer. Please call the displayed number directly."))}>Call provider</Button></> : <Text style={ui.small}>No clinic phone number on file.</Text>}
    </Card>)}
  </Screen>;
}
