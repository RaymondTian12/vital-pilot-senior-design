import { Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { SignOutButton } from "@/components/sign-out-button";
import { usePreview } from "@/context/preview-context";
import {
  Card,
  Heading,
  Row,
  Screen,
  ui,
} from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export default function Profile() {
  const { user } = useAuth();
  const { preview, setPreview } = usePreview();
  const router = useRouter();
  return (
    <Screen>
      <SignOutButton />
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
        <Row title="Goals & personal best" detail="Sleep, water, steps and peak flow" icon="vitals" onPress={() => router.push("/goals")} />
        <Row
          title="Account details"
          detail="View only · editing is not available yet"
          icon="person"
          onPress={() => router.push("/account-details")}
        />
        <Row
          title="Change password"
          detail="Update your account password"
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
        <Row title="Share with doctors" detail="Manage who can see your readings" icon="doctor" onPress={() => router.push("/sharing")} />
        <Row
          title="Notifications"
          icon="bell"
          onPress={() => router.push("/notifications")}
        />
      </Card>
    </Screen>
  );
}
