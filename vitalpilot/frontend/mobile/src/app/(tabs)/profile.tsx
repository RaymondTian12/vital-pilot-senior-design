import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { usePreview } from "@/context/preview-context";
import {
  Button,
  Card,
  Heading,
  Notice,
  Row,
  Screen,
  ui,
} from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export default function Profile() {
  const { user, signOut } = useAuth();
  const { preview, setPreview } = usePreview();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
    } catch {
      setError("Unable to clear the session. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading title="Your profile" />
      <View style={ui.row}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: C.blue,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={ui.title}>
            {`${user?.firstname?.[0] ?? ""}${user?.lastname?.[0] ?? ""}`.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={ui.heading}>
            {user?.firstname} {user?.lastname}
          </Text>
          <Text style={ui.subtitle}>{user?.email}</Text>
        </View>
      </View>
      <Card>
        <Text style={ui.eyebrow}>ACCOUNT</Text>
        <Row
          title="Account details"
          detail="View only · editing is not available yet"
          icon="person"
        />
        <Row
          title="Change password"
          detail="Not available yet"
          icon="lock"
          onPress={() => router.push("/change-password")}
        />
      </Card>
      <Card>
        <Text style={ui.eyebrow}>YOUR EXPERIENCE</Text>
        <Row
          title="Appearance"
          detail="Light · designed for clear readings"
          icon="eye"
        />
        <Row
          title="Sample preview"
          detail="Illustrative data only. Resets when you sign out."
          icon="grid"
          trailing={
            <Switch
              accessibilityLabel="Sample preview"
              value={preview}
              onValueChange={setPreview}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor={C.white}
            />
          }
        />
      </Card>
      <Card>
        <Text style={ui.eyebrow}>YOUR TOOLS</Text>
        <Row
          title="Explore"
          icon="grid"
          onPress={() => router.push("/explore")}
        />
        <Row
          title="Find a doctor"
          icon="doctor"
          onPress={() => router.push("/doctors")}
        />
        <Row
          title="Notifications"
          icon="bell"
          onPress={() => router.push("/notifications")}
        />
      </Card>
      {error && <Notice error>{error}</Notice>}
      <Button secondary icon="logout" loading={busy} onPress={logout}>
        Sign out
      </Button>
    </Screen>
  );
}
