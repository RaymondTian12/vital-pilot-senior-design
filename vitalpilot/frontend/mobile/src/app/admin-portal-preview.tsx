import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Card, Empty, Field, Heading, Notice, Screen, ui } from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

export default function AdminPortalPreview() {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  return <Screen brand={false}>
    <Heading title="Admin portal" subtitle="Welcome, Admin" />
    <Notice>Sample preview with fictional doctor applications. Real reviews require an admin account.</Notice>
    <View style={[ui.row, { gap: 8 }]}>
      {(["PENDING", "APPROVED", "REJECTED"] as const).map((option) =>
        <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: status === option }}
          onPress={() => setStatus(option)} style={{ flex: 1, minHeight: 48, borderRadius: 12,
            backgroundColor: status === option ? C.primary : C.white, borderColor: C.border, borderWidth: 1,
            alignItems: "center", justifyContent: "center" }}>
          <Text style={[ui.small, { fontWeight: "700", color: status === option ? C.white : C.primaryDark }]}>{option === "PENDING" ? "Pending" : option === "APPROVED" ? "Approved" : "Rejected"}</Text>
        </Pressable>)}
    </View>
    {status === "PENDING" ? <Card>
      <Text style={ui.heading}>Dr. Morgan Reed</Text>
      <Text style={ui.small}>morgan@example.invalid</Text>
      <Text style={ui.body}>NPI: 1234567890</Text>
      <Text style={ui.body}>Specialty: Family Medicine</Text>
      <Text style={ui.body}>License: TX EXAMPLE-123</Text>
      <Notice>Check the NPI Registry, identity, and active state license before approving. An NPI match alone does not verify a license.</Notice>
      <Field label="Review note" value="" editable={false} placeholder="Record what you checked or why you rejected this application" />
      <Text style={ui.body}>☐ I verified identity and active license</Text>
      <Button disabled>Approve doctor</Button>
      <Button secondary disabled>Reject application</Button>
    </Card> : <Empty title="No applications" message={`No ${status.toLowerCase()} doctor applications found.`} />}
  </Screen>;
}
