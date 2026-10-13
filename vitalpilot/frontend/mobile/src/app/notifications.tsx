import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useNotifications } from "@/context/notification-context";
import { usePreview } from "@/context/preview-context";
import {
  Button,
  Card,
  Chip,
  Empty,
  Heading,
  Notice,
  PreviewBadge,
  Row,
  Screen,
  ui,
} from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const samples = [
  {
    id: "sample-reading",
    title: "Review your reading",
    message: "Example alert for design preview.",
    icon: "vitals" as const,
  },
  {
    id: "sample-routine",
    title: "Keep your routine",
    message: "Example reminder.",
    icon: "calendar" as const,
  },
  {
    id: "sample-summary",
    title: "Your weekly overview",
    message: "Example report notification.",
    icon: "report" as const,
  },
];
export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } =
    useNotifications();
  const { preview, setPreview } = usePreview();
  const [unread, setUnread] = useState(false);
  const [sampleRead, setSampleRead] = useState<string[]>([]);
  const router = useRouter();
  const visible = notifications.filter((item) => !unread || !item.read);
  return (
    <Screen back>
      <Heading
        title="Notifications"
        subtitle="Important updates, clearly organized."
      />
      <View style={ui.row}>
        <Chip selected={!unread} onPress={() => setUnread(false)}>
          All
        </Chip>
        <Chip selected={unread} onPress={() => setUnread(true)}>
          Unread
        </Chip>
      </View>
      <Button
        secondary
        disabled={!notifications.length && !preview}
        onPress={() => {
          markAllAsRead();
          setSampleRead(samples.map((item) => item.id));
        }}
      >
        Mark all as read
      </Button>
      {visible.map((item) => (
        <Card
          key={item.id}
          style={{
            borderColor:
              item.severity === "critical"
                ? C.danger
                : item.severity === "warning"
                  ? C.warning
                  : C.border,
          }}
        >
          <Text
            style={[
              ui.eyebrow,
              {
                color:
                  item.severity === "critical" ? C.danger : C.textSecondary,
              },
            ]}
          >
            {item.severity.toUpperCase()}
            {!item.read ? " · UNREAD" : ""}
          </Text>
          <Row
            title={item.title}
            detail={item.message}
            icon="bell"
            onPress={() => {
              markAsRead(item.id);
              if (item.action) router.push(item.action.route as Href);
            }}
          />
          <Text style={ui.small}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </Card>
      ))}
      {preview && (
        <>
          <PreviewBadge />
          {samples
            .filter((item) => !unread || !sampleRead.includes(item.id))
            .map((item) => (
              <Card key={item.id}>
                <Row
                  title={item.title}
                  detail={item.message}
                  icon={item.icon}
                  onPress={() =>
                    setSampleRead((current) => [
                      ...new Set([...current, item.id]),
                    ])
                  }
                />
                <Text style={ui.small}>
                  {sampleRead.includes(item.id) ? "Read" : "Unread"} · preview
                  only
                </Text>
              </Card>
            ))}
          <Notice>Preview items are not saved notifications.</Notice>
        </>
      )}
      {!visible.length && !preview && (
        <>
          <Empty
            title="You’re all caught up"
            message="There are no notifications in this session. Saved notification history is not connected yet."
            icon="bell"
          />
          <Button secondary onPress={() => setPreview(true)}>
            Preview sample notifications
          </Button>
        </>
      )}
      {!!notifications.length && (
        <Button secondary onPress={clearAllNotifications}>
          Clear session notifications
        </Button>
      )}
    </Screen>
  );
}
