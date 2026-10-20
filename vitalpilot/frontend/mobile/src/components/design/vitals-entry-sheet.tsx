import { useRouter } from "expo-router";
import { SaveConfirmation } from "./save-confirmation";
import { ReadingResult } from "./blood-pressure-panel";
import type { BloodPressureReading } from "@/types/vitalpilot";
import { useAuth } from "@/context/auth-context";
import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Button, Field, ui } from "./ui";
import { Icon } from "./icon";
import { metricConfig, type Draft, type Metric } from "./vitals-data";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export function focusControl(node: View | Text | null) {
  if (!node) return;
  if (Platform.OS === "web") {
    (
      node as unknown as {
        focus?: () => void;
      }
    ).focus?.();
  } else {
    const tag = findNodeHandle(node);
    if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
  }
}
export function VitalsEntrySheet({
  metric,
  draft,
  reducedMotion,
  onChange,
  onClear,
  onClose,
  saving = false,
  preview = false,
  saveError = "",
  uncertain = false,
  authExpired = false,
  saved,
  onSave,
  onReviewHistory,
}: {
  metric: Metric;
  draft: Draft;
  reducedMotion: boolean;
  onChange: (field: keyof Draft, value: string) => void;
  onClear: () => void;
  onClose: () => void;
  saving?: boolean;
  preview?: boolean;
  saveError?: string;
  uncertain?: boolean;
  authExpired?: boolean;
  saved?: BloodPressureReading | null;
  onSave?: () => Promise<void>;
  onReviewHistory?: () => void;
}) {
  const router = useRouter();
  const config = metricConfig(metric);
  const { signOut } = useAuth();
  const supported = metric === "Blood Pressure";
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const stackFields = width < 360 || fontScale >= 1.3;
  const title = useRef<Text>(null);
  const initialSavedId = useRef(saved?.log_id);
  const scrollView = useRef<ScrollView>(null);
  const closing = useRef(false);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);
  const shade = useAnimatedStyle(() => ({
    opacity: Math.max(0, progress.value) * Math.max(0, 1 - drag.value / height),
  }));
  const reveal = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.value) * height + drag.value }],
  }));
  useEffect(() => {
    progress.value = reducedMotion
      ? withTiming(1, { duration: 120 })
      : withSpring(1, { damping: 28, stiffness: 260, mass: 0.9, overshootClamping: true });
    return () => { cancelAnimation(progress); cancelAnimation(drag); };
  }, [progress, drag, reducedMotion]);
  function close() {
    if (closing.current || saving) return;
    closing.current = true;
    Keyboard.dismiss();
    progress.value = withTiming(
      0,
      { duration: reducedMotion ? 100 : 180 },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  }
  const headerPan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      !(saving || closing.current) && gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.3,
    onPanResponderGrant: () => { cancelAnimation(drag); Keyboard.dismiss(); },
    onPanResponderMove: (_, gesture) => { drag.value = Math.max(0, gesture.dy); },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > Math.min(140, height * 0.18) || (gesture.vy > 0.8 && gesture.dy > 32)) {
        close();
      } else {
        drag.value = reducedMotion ? 0 : withSpring(0, { damping: 24, stiffness: 260 });
      }
    },
    onPanResponderTerminate: () => {
      drag.value = reducedMotion ? 0 : withSpring(0, { damping: 24, stiffness: 260 });
    },
  });
  function clear() {
    onClear();
    AccessibilityInfo.announceForAccessibility(
      `${metric} draft cleared. Nothing was saved.`,
    );
  }
  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
      onShow={() => requestAnimationFrame(() => focusControl(title.current))}
    >
      <View style={styles.modal}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.scrim, shade]}
        />
        <KeyboardAvoidingView
          style={styles.avoider}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            accessibilityViewIsModal
            role="dialog"
            accessibilityLabel={`${metric} reading`}
            style={[
              styles.sheet,
              {
                maxHeight: height - insets.top - 24,
                paddingBottom: Math.max(insets.bottom, 16),
              },
              reveal,
            ]}
          >
            <View style={styles.header} {...headerPan.panHandlers}>
              <View style={styles.handle} />
              <View style={[ui.row, { alignItems: "flex-start" }]}>
                <View style={styles.icon}>
                  <Icon name={config.icon} size={26} color={C.primaryDark} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    ref={title}
                    {...(Platform.OS === "web" ? { tabIndex: -1 } : {})}
                    accessibilityRole="header"
                    style={styles.title}
                  >
                    {metric}
                  </Text>
                  <Text style={ui.small}>
                    Your latest reading · {config.unit}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close reading sheet"
                  onPress={close}
                  style={styles.close}
                >
                  <Icon name="close" color={C.title} size={20} />
                </Pressable>
              </View>
            </View>
            <ScrollView
              ref={scrollView}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={{ flexShrink: 1 }}
              contentContainerStyle={styles.content}
            >
              <View
                style={[
                  ui.row,
                  { justifyContent: "space-between", flexWrap: "wrap" },
                ]}
              >
                <View style={styles.draftBadge}>
                  <Text style={styles.draftText}>
                    {saving
                      ? "Saving…"
                      : saved && !draft.primary && !draft.secondary
                        ? "Saved to your account"
                        : "Draft — not saved"}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Keyboard.dismiss();
                    if (Platform.OS === "web")
                      (
                        globalThis.document?.activeElement as HTMLElement | null
                      )?.blur();
                  }}
                  style={styles.textAction}
                >
                  <Text style={ui.link}>Hide keyboard</Text>
                </Pressable>
              </View>
              <Text style={ui.body}>{config.hint}</Text>
              <View
                testID="vitals-inputs"
                style={{
                  gap: 14,
                  flexDirection: stackFields ? "column" : "row",
                }}
              >
                <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
                  <Field
                    label={config.primary}
                    labelStyle={
                      config.secondary && !stackFields
                        ? { minHeight: 46 }
                        : undefined
                    }
                    value={draft.primary}
                    editable={!saving}
                    onChangeText={(value) => onChange("primary", value)}
                    keyboardType={config.integer ? "number-pad" : "decimal-pad"}
                    inputMode={config.integer ? "numeric" : "decimal"}
                    placeholder="—"
                    style={styles.input}
                    selectionColor={C.primary}
                    keyboardAppearance="light"
                  />
                  <Text style={ui.small}>{config.unit}</Text>
                </View>
                {config.secondary && (
                  <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
                    <Field
                      label={config.secondary}
                      labelStyle={!stackFields ? { minHeight: 46 } : undefined}
                      value={draft.secondary}
                      editable={!saving}
                      onChangeText={(value) => onChange("secondary", value)}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      placeholder="—"
                      style={styles.input}
                      selectionColor={C.primary}
                      keyboardAppearance="light"
                    />
                    <Text style={ui.small}>{config.unit}</Text>
                  </View>
                )}
              </View>
              <View style={styles.status}>
                <Icon name="info" size={20} />
                <Text style={[ui.small, { flex: 1, color: C.title }]}>
                  {supported
                    ? preview
                      ? "Sample preview is on. Turn it off to save a real reading."
                      : "Saved using the server’s current time. Review the result below after saving."
                    : "Saving not available yet. This entry stays as a draft."}
                </Text>
              </View>
              {!!saveError && (
                <Text accessibilityRole="alert" style={{ color: C.danger }}>
                  {saveError}
                </Text>
              )}
              {saved && (
                <View onLayout={(event) => {
                  if (saved.log_id !== initialSavedId.current) {
                    const y = Math.max(0, event.nativeEvent.layout.y - 20);
                    requestAnimationFrame(() => scrollView.current?.scrollTo({ y, animated: !reducedMotion }));
                  }
                }}>
                  <SaveConfirmation key={saved.log_id} animate={saved.log_id !== initialSavedId.current} reducedMotion={reducedMotion}>
                    <ReadingResult reading={saved} showCare onFindCare={(specialty) => {
                      onClose();
                      router.push({ pathname: "/doctors", params: { specialty, reason: "blood-pressure" } });
                    }} />
                  </SaveConfirmation>
                </View>
              )}
              {authExpired ? (
                <Button onPress={() => void signOut()}>Sign in again</Button>
              ) : uncertain ? (
                <>
                  <Text style={ui.body}>
                    This reading may already be saved. Check your history before
                    trying again.
                  </Text>
                  <Button onPress={onReviewHistory}>
                    Check history before retrying
                  </Button>
                </>
              ) : (
                <Button
                  disabled={
                    !supported ||
                    preview ||
                    saving ||
                    !draft.primary.trim() ||
                    !draft.secondary.trim()
                  }
                  onPress={() => void onSave?.()}
                >
                  {saving
                    ? "Saving…"
                    : supported
                      ? "Save reading"
                      : "Saving unavailable"}
                </Button>
              )}
              <View
                style={[
                  ui.row,
                  { justifyContent: "space-between", flexWrap: "wrap" },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear draft"
                  disabled={saving}
                  onPress={clear}
                  style={styles.textAction}
                >
                  <Text style={ui.link}>Clear draft</Text>
                </Pressable>
                <Text style={[ui.small, { flexShrink: 1 }]}>
                  {draft.primary || draft.secondary ? "Closing keeps this draft for this session." : saved ? "Your saved reading stays in your account." : "Nothing has been saved yet."}
                </Text>
              </View>
              <Button disabled={saving} onPress={close}>
                Done
              </Button>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modal: { flex: 1 },
  scrim: { backgroundColor: "#142A3566" },
  avoider: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    flexShrink: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  header: { padding: 20, gap: 18, backgroundColor: C.blue },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#95B8C7",
    borderRadius: 4,
    alignSelf: "center",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: C.title,
  },
  icon: {
    width: 50,
    height: 50,
    backgroundColor: C.white,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFFB3",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, gap: 18, paddingBottom: 10 },
  input: {
    minHeight: 76,
    backgroundColor: "#F6FAFC",
    borderRadius: 18,
    fontSize: 32,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  draftBadge: {
    backgroundColor: C.mint,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
  },
  draftText: { color: C.primaryDark, fontWeight: "600", fontSize: 13 },
  textAction: { minHeight: 48, justifyContent: "center", paddingVertical: 10 },
  status: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: C.background,
    padding: 14,
    borderRadius: 14,
  },
});
