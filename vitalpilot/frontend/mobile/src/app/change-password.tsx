import { Text } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  Field,
  Heading,
  Notice,
  Orbit,
  Screen,
  ui,
} from "@/components/design/ui";
export default function ChangePassword() {
  const router = useRouter();
  return (
    <Screen back>
      <Heading title="Change password" />
      <Notice>
        Password changes are not available yet. Your password has not been
        changed.
      </Notice>
      <Orbit size={145} icon="lock" />
      <Card>
        <Field
          label="Current password"
          placeholder="Not available yet"
          secureTextEntry
          editable={false}
        />
        <Field
          label="New password"
          placeholder="Not available yet"
          secureTextEntry
          editable={false}
        />
        <Text style={ui.small}>
          Use at least 8 characters and choose a different password.
        </Text>
        <Field
          label="Confirm new password"
          placeholder="Not available yet"
          secureTextEntry
          editable={false}
        />
        <Button disabled>Update password</Button>
      </Card>
      <Button secondary onPress={() => router.replace("/profile")}>
        Back to profile
      </Button>
    </Screen>
  );
}
