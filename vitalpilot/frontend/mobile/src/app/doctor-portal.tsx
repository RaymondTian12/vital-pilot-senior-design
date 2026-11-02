import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";
import { Button, Card, Empty, Heading, Notice, Screen, ui } from "@/components/design/ui";

type Patient = { user_id: number; first_name: string; last_name: string; date_of_birth: string };
export default function DoctorPortal() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(""); setPatients([]);
      const result = await api.doctorStatus();
      setStatus(result.status);
      if (result.status === "APPROVED") setPatients((await api.doctorPatients()).patients);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load patients."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <Screen brand={false}>
    <Heading title="Doctor portal" subtitle={`Welcome, Dr. ${user?.lastname ?? ""}`} />
    {status === "APPROVED" && <Notice>Only patients who currently share their records with you appear here.</Notice>}
    {status === "PENDING" && <Notice>Your doctor account is awaiting verification. You can check back here after the VitalPilot team reviews your details.</Notice>}
    {status === "REJECTED" && <Notice error>Your doctor registration was not approved. Contact the VitalPilot team if you need help.</Notice>}
    {!!error && <Notice error>{error}</Notice>}
    {loading && <Text style={ui.body}>Loading patients…</Text>}
    {!loading && !error && status === "APPROVED" && !patients.length && <Empty title="No shared patients" message="When a patient grants access, they will appear here." />}
    {patients.map((p) => <Card key={p.user_id}>
      <Text style={ui.heading}>{p.first_name} {p.last_name}</Text>
      <Text style={ui.small}>Date of birth: {String(p.date_of_birth)}</Text>
      <Button onPress={() => router.push({ pathname: "/doctor-patient", params: { id: String(p.user_id) } })}>View records</Button>
    </Card>)}
    <Button secondary onPress={() => void load()}>Refresh</Button>
    <Button secondary onPress={() => void signOut()}>Sign out</Button>
  </Screen>;
}
