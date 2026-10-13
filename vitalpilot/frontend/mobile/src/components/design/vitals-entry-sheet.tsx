import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button, Field, ui } from "./ui";
import { Icon } from "./icon";
import { metricConfig, type Draft, type Metric } from "./vitals-data";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

export function focusControl(node: View | Text | null) {
  if (!node) return;
  if (Platform.OS === "web") {
    (node as unknown as { focus?: () => void }).focus?.();
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
}: {
  metric: Metric;
  draft: Draft;
  reducedMotion: boolean;
  onChange: (field: keyof Draft, value: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const config = metricConfig(metric);
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const stackFields = width < 360 || fontScale >= 1.3;
  const title = useRef<Text>(null);
  const closing = useRef(false);
  const progress = useSharedValue(0);
  const shade = useAnimatedStyle(() => ({ opacity: progress.value }));
  const reveal = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.value) * 36 }],
  }));
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reducedMotion ? 120 : 240,
      easing: Easing.out(Easing.cubic),
    });
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion]);
  function close() {
    if (closing.current) return;
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
            <View style={styles.header}>
              <View style={styles.handle} />
              <View style={[ui.row, { alignItems: "flex-start" }]}>
                <View style={styles.icon}>
                  <Icon name={config.icon} size={26} color={C.primaryDark} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    ref={title}
                    tabIndex={-1}
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
                  <Text style={styles.draftText}>Draft — not saved</Text>
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
                  Saving isn’t connected yet. Entries stay here as drafts and
                  won’t appear in your history.
                </Text>
              </View>
              <Button disabled>Saving unavailable</Button>
              <View
                style={[
                  ui.row,
                  { justifyContent: "space-between", flexWrap: "wrap" },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear draft"
                  onPress={clear}
                  style={styles.textAction}
                >
                  <Text style={ui.link}>Clear draft</Text>
                </Pressable>
                <Text style={[ui.small, { flexShrink: 1 }]}>
                  Closing keeps this draft for this session.
                </Text>
              </View>
              <Button onPress={close}>Done</Button>
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
