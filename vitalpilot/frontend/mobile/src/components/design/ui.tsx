import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { VitalPilotLogo } from "@/components/vitalpilot/logo";
import { VitalPilotColors as C, Layout } from "@/constants/vitalpilot";
import { Icon, type IconName } from "./icon";
export const ui = StyleSheet.create({
  title: {
    fontSize: 29,
    fontWeight: "700",
    color: C.title,
    letterSpacing: -0.9,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: "700",
    color: C.title,
    letterSpacing: -1.4,
  },
  subtitle: { fontSize: 16, lineHeight: 24, color: C.textSecondary },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: C.title,
    letterSpacing: -0.4,
  },
  body: { fontSize: 15, lineHeight: 23, color: C.title },
  small: { fontSize: 13, lineHeight: 19, color: C.textSecondary },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "700",
    color: C.textSecondary,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  stack: { gap: 16 },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Layout.radius,
    padding: 18,
    gap: 14,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: C.white,
    paddingHorizontal: 15,
    fontSize: 16,
    color: C.title,
    flex: 1,
    minWidth: 0,
    width: 0,
  },
  link: { color: C.primaryDark, fontWeight: "700", fontSize: 15 },
});
export function Screen({
  children,
  back = false,
  brand = true,
  footer,
  scroll = true,
}: {
  children: ReactNode;
  back?: boolean;
  brand?: boolean;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const router = useRouter();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.background }}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: Layout.gutter,
              paddingTop: 16,
              paddingBottom: 36,
              gap: 24,
              width: "100%",
              maxWidth: Layout.contentWidth,
              alignSelf: "center",
            }}
          >
            {(brand || back) && (
              <View style={[ui.row, { justifyContent: "space-between" }]}>
                {back ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={() =>
                      router.canGoBack()
                        ? router.back()
                        : router.replace("/home")
                    }
                    style={[ui.row, { minHeight: 48, minWidth: 48 }]}
                  >
                    <Icon name="back" color={C.title} />
                    <Text style={ui.small}>Back</Text>
                  </Pressable>
                ) : (
                  <Brand />
                )}
                {back && brand && <Brand />}
                {!back && (
                  <Pressable
                    accessibilityLabel="Open notifications"
                    accessibilityRole="button"
                    onPress={() => router.push("/notifications")}
                    style={{ padding: 12 }}
                  >
                    <Icon name="bell" color={C.title} />
                  </Pressable>
                )}
              </View>
            )}
            {children}
          </ScrollView>
        ) : (
          children
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Brand() {
  return (
    <View style={[ui.row, { gap: 8 }]}>
      <VitalPilotLogo size={34} />
      <Text
        style={{
          color: C.title,
          fontSize: 22,
          fontWeight: "700",
          letterSpacing: -0.7,
        }}
      >
        VitalPilot
      </Text>
    </View>
  );
}
export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={ui.title}>
        {title}
      </Text>
      {subtitle && <Text style={ui.subtitle}>{subtitle}</Text>}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[ui.card, style]}>{children}</View>;
}
export function Button({
  children,
  onPress,
  secondary,
  disabled,
  loading,
  icon,
}: {
  children: ReactNode;
  onPress?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        padding: 15,
        borderRadius: 14,
        borderWidth: secondary ? 1 : 0,
        borderColor: inactive ? C.border : C.primary,
        backgroundColor: inactive
          ? "#E0E6EB"
          : secondary
            ? "transparent"
            : C.primary,
        opacity: pressed ? 0.8 : 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 10,
      })}
    >
      {loading ? (
        <ActivityIndicator color={C.primary} />
      ) : (
        icon && <Icon name={icon} color={secondary ? C.primary : C.white} />
      )}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: inactive
            ? C.textSecondary
            : secondary
              ? C.primaryDark
              : C.white,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  labelStyle,
  secureTextEntry,
  error,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  labelStyle?: StyleProp<TextStyle>;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 8, flex: 1, minWidth: 0 }}>
      <Text style={[ui.body, { fontWeight: "600" }, labelStyle]}>{label}</Text>
      <View style={ui.row}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          secureTextEntry={secureTextEntry && !show}
          placeholderTextColor="#6B8191"
          style={[
            ui.input,
            props.style,
            error ? { borderColor: C.danger } : null,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={show ? "Hide password" : "Show password"}
            onPress={() => setShow(!show)}
            style={{
              minHeight: 48,
              minWidth: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="eye" color={C.textSecondary} />
          </Pressable>
        )}
      </View>
      {error && <Notice error>{error}</Notice>}
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole={error ? "alert" : undefined}
      accessibilityLiveRegion={error ? "assertive" : "polite"}
      style={[
        ui.row,
        {
          alignItems: "flex-start",
          backgroundColor: error ? "#FFF0EE" : C.blue,
          borderRadius: 12,
          padding: 14,
        },
      ]}
    >
      <Icon name="info" color={error ? C.danger : C.primary} size={19} />
      <Text style={[ui.small, { flex: 1, color: error ? C.danger : C.title }]}>
        {children}
      </Text>
    </View>
  );
}
export function Chip({
  children,
  selected,
  onPress,
}: {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: selected ? C.primary : C.white,
        borderWidth: 1,
        borderColor: selected ? C.primary : C.border,
      }}
    >
      <Text
        style={{
          color: selected ? C.white : C.title,
          fontWeight: "600",
          fontSize: 14,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Row({
  title,
  detail,
  icon,
  onPress,
  trailing,
}: {
  title: string;
  detail?: string;
  icon: IconName;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? title : undefined}
      onPress={onPress}
      style={[ui.row, { minHeight: 64, paddingVertical: 10 }]}
    >
      <View style={{ backgroundColor: C.mint, padding: 11, borderRadius: 16 }}>
        <Icon name={icon} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[ui.body, { fontWeight: "600" }]}>{title}</Text>
        {detail && <Text style={ui.small}>{detail}</Text>}
      </View>
      {trailing ??
        (onPress && <Icon name="chevron" size={18} color={C.textSecondary} />)}
    </Pressable>
  );
}
export function Empty({
  title,
  message,
  icon = "report",
}: {
  title: string;
  message: string;
  icon?: IconName;
}) {
  return (
    <Card>
      <View style={{ alignItems: "center", gap: 14, paddingVertical: 16 }}>
        <Orbit size={100} icon={icon} />
        <Text style={[ui.heading, { textAlign: "center" }]}>{title}</Text>
        <Text style={[ui.subtitle, { textAlign: "center" }]}>{message}</Text>
      </View>
    </Card>
  );
}
export function PreviewBadge() {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: C.mint,
        borderRadius: 24,
        paddingHorizontal: 13,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: C.primaryDark, fontSize: 13, fontWeight: "600" }}>
        Sample preview
      </Text>
    </View>
  );
}
export function Orbit({
  size = 220,
  logo = false,
  icon = "sparkles",
}: {
  size?: number;
  logo?: boolean;
  icon?: IconName;
}) {
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size,
          backgroundColor: "#E4F1F7",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: size * 0.55,
          borderWidth: 1.5,
          borderColor: "#7ABCC9",
          borderRadius: size,
          transform: [{ rotate: "-25deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.7,
          height: size,
          borderWidth: 1,
          borderColor: "#B6D5E6",
          borderRadius: size,
          transform: [{ rotate: "25deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.15,
          right: size * 0.07,
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: size,
          backgroundColor: C.peach,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: size * 0.2,
          left: size * 0.07,
          width: size * 0.06,
          height: size * 0.06,
          borderRadius: size,
          backgroundColor: C.primary,
        }}
      />
      {logo ? (
        <VitalPilotLogo size={size * 0.47} />
      ) : (
        <Icon name={icon} size={size * 0.3} />
      )}
    </View>
  );
}
