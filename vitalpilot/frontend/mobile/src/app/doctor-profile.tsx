import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { api, ApiError, type DoctorProfile } from "@/services/api";
import { Button, Card, Field, Heading, Notice, Screen, ui } from "@/components/design/ui";

type FormState = {
  first_name: string; last_name: string; specialty: string;
  clinic_name: string; clinic_phone: string;
  npi: string; license_state: string; license_number: string;
};

function toForm(profile: DoctorProfile): FormState {
  return {
    first_name: profile.first_name, last_name: profile.last_name, specialty: profile.specialty,
    clinic_name: profile.clinic_name ?? "", clinic_phone: profile.clinic_phone ?? "",
    npi: profile.npi, license_state: profile.license_state, license_number: profile.license_number,
  };
}

export default function DoctorProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"details" | "identity" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const result = await api.doctorProfile();
      setProfile(result);
      setForm(toForm(result));
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Couldn't load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function saveDetails() {
    if (!form) return;
    setSaving("details"); setError(""); setMessage("");
    try {
      const updated = await api.updateDoctorProfile({
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        specialty: form.specialty.trim(), clinic_name: form.clinic_name.trim(), clinic_phone: form.clinic_phone.trim(),
      });
      setProfile(updated); setForm(toForm(updated));
      setMessage("Profile details saved.");
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Couldn't save your details.");
    } finally {
      setSaving(null);
    }
  }

  async function saveIdentity() {
    if (!form) return;
    setSaving("identity"); setError(""); setMessage("");
    try {
      const updated = await api.updateDoctorProfile({
        npi: form.npi.trim(), license_state: form.license_state.trim(), license_number: form.license_number.trim(),
      });
      setProfile(updated); setForm(toForm(updated));
      setMessage(
        updated.verification_status === "PENDING"
          ? "Saved. Since your license details changed, your account needs a fresh review -- you won't be able to view any patient's records (including existing ones) until it's re-approved."
          : "License details saved.",
      );
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Couldn't save your license details.");
    } finally {
      setSaving(null);
    }
  }

  return <Screen back>
    <Heading title="Your profile" subtitle="Update your account and license details." />
    {!!error && <Notice error>{error}</Notice>}
    {!!message && <Notice>{message}</Notice>}
    {loading || !form ? <Text style={ui.body}>Loading profile…</Text> : <>
      {profile?.verification_status === "PENDING" && (
        <Notice>Your account is awaiting verification. Patients cannot share records with you until the VitalPilot team reviews it.</Notice>
      )}
      <Card>
        <Text style={ui.eyebrow}>ACCOUNT DETAILS</Text>
        <Field label="First name" value={form.first_name} editable={saving === null} onChangeText={(v) => setForm((f) => f && { ...f, first_name: v })} />
        <Field label="Last name" value={form.last_name} editable={saving === null} onChangeText={(v) => setForm((f) => f && { ...f, last_name: v })} />
        <Field label="Specialty" value={form.specialty} editable={saving === null} onChangeText={(v) => setForm((f) => f && { ...f, specialty: v })} />
        <Field label="Clinic name" value={form.clinic_name} editable={saving === null} placeholder="Optional" onChangeText={(v) => setForm((f) => f && { ...f, clinic_name: v })} />
        <Field label="Clinic phone" value={form.clinic_phone} editable={saving === null} placeholder="Optional" keyboardType="phone-pad" onChangeText={(v) => setForm((f) => f && { ...f, clinic_phone: v })} />
        <Button disabled={saving !== null} onPress={() => void saveDetails()}>{saving === "details" ? "Saving…" : "Save details"}</Button>
      </Card>
      <Card>
        <Text style={ui.eyebrow}>LICENSE & IDENTITY</Text>
        <Text style={ui.small}>Changing any of these re-submits your account for admin review. You won't be able to view any patient's records -- including patients who already share with you -- until it's re-approved. Their consent is preserved, so access resumes automatically once you are.</Text>
        <Field label="NPI" value={form.npi} editable={saving === null} keyboardType="number-pad" onChangeText={(v) => setForm((f) => f && { ...f, npi: v })} />
        <Field label="License state" value={form.license_state} editable={saving === null} autoCapitalize="characters" maxLength={2} onChangeText={(v) => setForm((f) => f && { ...f, license_state: v })} />
        <Field label="License number" value={form.license_number} editable={saving === null} onChangeText={(v) => setForm((f) => f && { ...f, license_number: v })} />
        <Button secondary disabled={saving !== null} onPress={() => void saveIdentity()}>{saving === "identity" ? "Saving…" : "Save license details"}</Button>
      </Card>
      <Button secondary disabled={saving !== null} onPress={() => router.back()}>Back</Button>
    </>}
  </Screen>;
}
