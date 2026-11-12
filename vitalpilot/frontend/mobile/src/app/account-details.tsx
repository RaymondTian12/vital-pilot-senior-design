import { Text, View } from "react-native";
import { useAuth } from "@/context/auth-context";
import { Card, Heading, Screen, ui } from "@/components/design/ui";

const ROLE_LABELS: Record<string, string> = {
  patient: "Patient",
  provider: "Provider",
  admin: "Admin",
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={ui.eyebrow}>{label}</Text>
      <Text style={ui.body}>{value}</Text>
    </View>
  );
}

export default function AccountDetails() {
  const { user } = useAuth();
  return (
    <Screen back>
      <Heading
        title="Account details"
        subtitle="View only · editing is not available yet"
      />
      <Card style={{ gap: 16 }}>
        <Detail
          label="Name"
          value={`${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim() || "—"}
        />
        <Detail label="Email" value={user?.email ?? "—"} />
        <Detail
          label="Account type"
          value={(user?.role && ROLE_LABELS[user.role]) || "—"}
        />
        <Detail
          label="Member since"
          value={
            user?.created_at
              ? new Date(user.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"
          }
        />
      </Card>
    </Screen>
  );
}
