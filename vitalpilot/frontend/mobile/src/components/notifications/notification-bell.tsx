import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/design/icon";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

type NotificationBellProps = {
  count: number;
  onPress: () => void;
};

export function NotificationBell({ count, onPress }: NotificationBellProps) {
  const unread = Math.max(0, Math.floor(count));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        unread
          ? `Notifications, ${unread} unread`
          : "Notifications, no unread updates"
      }
      accessibilityHint="Opens your saved alerts and updates"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="bell" size={25} color={C.primaryDark} />
      {unread > 0 && (
        <View pointerEvents="none" style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.mint,
    borderWidth: 1,
    borderColor: C.mintStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 22,
    minHeight: 22,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: C.danger,
    borderWidth: 2,
    borderColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: C.white, fontSize: 11, fontWeight: "700" },
  pressed: { backgroundColor: C.mintStrong, opacity: 0.8 },
});
