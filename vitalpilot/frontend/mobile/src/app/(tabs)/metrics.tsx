import { useVitalReading } from "@/context/vital-readings-context";
import { readingValue } from "@/services/vital-readings";
import { useBloodPressure } from "@/context/blood-pressure-context";
import type { BloodPressureReading, SavedMetricReading } from "@/types/vitalpilot";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { usePreview } from "@/context/preview-context";
import { useNotifications } from "@/context/notification-context";
import { Button, Card, Screen, ui } from "@/components/design/ui";
import { Icon } from "@/components/design/icon";
import {
  emptyDraft,
  habitMetrics,
  healthMetrics,
  isMetric,
  metricConfig,
  type Draft,
  type Metric,
} from "@/components/design/vitals-data";
import {
  focusControl,
  VitalsEntrySheet,
} from "@/components/design/vitals-entry-sheet";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export default function Metrics() {
  const router = useRouter();
  const { metric } = useLocalSearchParams<{
    metric?: string | string[];
  }>();
  const handledMetric = useRef<string | undefined>(undefined);
  const [selected, setSelected] = useState<Metric>("Blood Pressure");
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Partial<Record<Metric, Draft>>>({});
  const [reducedMotion, setReducedMotion] = useState(true);
  const { width, fontScale } = useWindowDimensions();
  const singleColumn = width < 360 || fontScale >= 1.3;
  const tileWidth = singleColumn ? "100%" : (Math.min(width, 640) - 52) / 2;
  const bp = useBloodPressure();
  useFocusEffect(useCallback(() => { void bp.refresh(); }, [bp.refresh]));
  const selectedType = metricConfig(selected).type;
  const other = useVitalReading(selectedType === "BLOOD_PRESSURE" ? "BLOOD_GLUCOSE" : selectedType);
  const active = selectedType === "BLOOD_PRESSURE" ? bp : other;
  const [saved, setSaved] = useState<SavedMetricReading | null>(null);
  const { preview, setPreview } = usePreview();
  const { refreshNotifications } = useNotifications();
  const opener = useRef<View | null>(null);
  const overview = useRef<Text>(null);
  // The entry sheet is a native Modal, and so is the critical-alert popup --
  // refreshing notifications (which can make that popup visible) while the
  // sheet's own Modal is still open/closing can present two native modals
  // at once, which has frozen the UI on-device. Defer the refresh until
  // after the sheet has actually closed instead of firing it immediately.
  const pendingNotificationRefresh = useRef(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReducedMotion(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      const requested = Array.isArray(metric) ? metric[0] : metric;
      if (isMetric(requested) && handledMetric.current !== requested) {
        handledMetric.current = requested;
        opener.current = null;
        setSaved(null);
        setSelected(requested);
        setOpen(true);
      }
      return () => setOpen(false);
    }, [metric]),
  );
  function edit(name: Metric, node: View | null, latest?: SavedMetricReading) {
    if (latest && ["SLEEP", "WATER_INTAKE", "PHYSICAL_ACTIVITY"].includes(latest.metric_type) && new Date(latest.recorded_at).toDateString() === new Date().toDateString()) {
      setDrafts(current => current[name]?.primary ? current : { ...current, [name]: { ...emptyDraft, primary: readingValue(latest) } });
    }
    opener.current = node;
    setSaved(null);
    setSelected(name);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    requestAnimationFrame(() =>
      focusControl(opener.current ?? overview.current),
    );
    if (pendingNotificationRefresh.current) {
      pendingNotificationRefresh.current = false;
      // Give the sheet's Modal time to finish dismissing natively before a
      // new notification (banner or critical modal) can become visible.
      setTimeout(() => void refreshNotifications(), 400);
    }
  }
  function change(field: keyof Draft, value: string) {
    setDrafts((current) => ({
      ...current,
      [selected]: { ...(current[selected] ?? emptyDraft), [field]: value },
    }));
  }
  return (
    <>
      <Screen>
        <View
          style={styles.overview}
          accessibilityElementsHidden={open}
          importantForAccessibility={open ? "no-hide-descendants" : "auto"}
        >
          <View style={{ gap: 6 }}>
            <Text
              ref={overview}
              {...(Platform.OS === "web" ? { tabIndex: -1 } : {})}
              accessibilityRole="header"
              style={ui.title}
            >
              Vitals
            </Text>
            <Text style={ui.subtitle}>Small check-ins. A clearer picture.</Text>
          </View>
          <Card style={styles.hero}>
            <View style={[ui.row, { justifyContent: "space-between" }]}>
              <Text style={[ui.eyebrow, { color: C.primaryDark, flex: 1 }]}>
                YOUR DAILY CHECK-IN
              </Text>
              <View style={styles.heroIcon}>
                <Icon name="vitals" size={28} color={C.primaryDark} />
              </View>
            </View>
            <Text style={styles.heroTitle}>
              Make a little space{singleColumn ? " " : "\n"}for your health.
            </Text>
            <Text style={[ui.body, { color: C.textSecondary }]}>
              Choose a reading below. Your check-in starts with one number.
            </Text>
          </Card>
          <View style={styles.connection}>
            <Icon name="info" size={18} />
            <Text style={[ui.small, { flex: 1 }]}>
              Save readings to your account. Tap View history on any metric to review past entries.
            </Text>
          </View>
          <View style={styles.previewControl}>
            <View style={{ gap: 4, flex: 1 }}>
              <Text style={styles.sectionLabel}>Sample preview</Text>
              <Text style={ui.small}>
                {preview
                  ? "Examples only · not your records"
                  : "See how readings and trends will look"}
              </Text>
            </View>
            <View
              style={{
                minWidth: 60,
                minHeight: 52,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Switch
                accessibilityLabel="Sample preview"
                hitSlop={10}
                value={preview}
                onValueChange={setPreview}
                trackColor={{ false: C.border, true: C.primary }}
                thumbColor={C.white}
                ios_backgroundColor={C.border}
              />
            </View>
          </View>
          {[
            { title: "Health readings", metrics: healthMetrics },
            { title: "Daily habits", metrics: habitMetrics },
          ].map((group) => (
            <View key={group.title} style={{ gap: 12 }}>
              <Text accessibilityRole="header" style={ui.heading}>
                {group.title}
              </Text>
              <View style={styles.grid}>
                {group.metrics.map((name, index) => (
                  <MetricTile
                    key={name}
                    name={name}
                    preview={preview}
                    reading={
                      name === "Blood Pressure" ? bp.records[0] : undefined
                    }
                    reducedMotion={reducedMotion}
                    width={tileWidth}
                    hasDraft={
                      !!(drafts[name]?.primary || drafts[name]?.secondary)
                    }
                    accent={index % 2 === 0 ? C.mint : C.blue}
                    onOpen={edit}
                  />
                ))}
              </View>
            </View>
          ))}

        </View>
      </Screen>
      {open && (
        <VitalsEntrySheet
          key={selected}
          metric={selected}
          draft={drafts[selected] ?? emptyDraft}
          reducedMotion={reducedMotion}
          saving={active.saving}
          preview={preview}
          saveError={active.saveError}
          uncertain={active.uncertain}
          authExpired={active.authExpired}
          saved={saved}
          latestReading={active.records[0]}
          onReviewHistory={() => {
            setOpen(false);
            router.push({ pathname: "/metric-history", params: { metric: selectedType } });
          }}
          onSave={async () => {
            const draft = drafts[selected] ?? emptyDraft;
            const reading = await active.save(
              draft.primary,
              draft.secondary,
              preview,
              { glucose_context: draft.glucoseContext || "unknown", peak_personal_best: draft.personalBest || "" },
            );
            if (reading) {
              setSaved(reading);
              setDrafts((current) => ({
                ...current,
                [selected]: { ...emptyDraft },
              }));
              pendingNotificationRefresh.current = true;
            }
          }}
          onChange={change}
          onClear={() =>
            setDrafts((current) => ({
              ...current,
              [selected]: { ...emptyDraft },
            }))
          }
          onClose={close}
        />
      )}
    </>
  );
}
function MetricTile({
  name,
  width,
  accent,
  preview,
  reading,
  hasDraft,
  reducedMotion,
  onOpen,
}: {
  name: Metric;
  width: number | "100%";
  accent: string;
  preview: boolean;
  reading?: BloodPressureReading;
  hasDraft: boolean;
  reducedMotion: boolean;
  onOpen: (name: Metric, node: View | null, latest?: SavedMetricReading) => void;
}) {
  const router = useRouter();
  const config = metricConfig(name);
  const other = useVitalReading(config.type === "BLOOD_PRESSURE" ? "BLOOD_GLUCOSE" : config.type);
  const latest: SavedMetricReading | undefined = config.type === "BLOOD_PRESSURE" ? reading : other.records[0];
  useFocusEffect(useCallback(() => {
    if (config.type !== "BLOOD_PRESSURE") void other.refresh();
  }, [config.type, other.refresh]));
  const trigger = useRef<View>(null);
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[{ width, gap: 8 }, animated]}>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={`Enter ${name}`}
        accessibilityHint={`Opens the ${name} draft form. ${preview ? "Displayed value is an example." : latest ? `Latest saved reading: ${readingValue(latest)} ${config.unit}.` : "No saved readings."}${hasDraft ? " You have an unsaved draft." : ""}`}
        onPress={() => onOpen(name, trigger.current, latest)}
        onPressIn={() => {
          scale.value = withTiming(reducedMotion ? 1 : 0.98, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: reducedMotion ? 0 : 150 });
        }}
        style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <View style={[styles.metricIcon, { backgroundColor: accent }]}>
            <Icon name={config.icon} size={23} />
          </View>
          <Icon name="arrow" size={18} color={C.textSecondary} />
        </View>
        <Text style={styles.tileName}>{name}</Text>
        {preview ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.tileValue}>{config.sample}</Text>
            <Text style={styles.sampleTag}>SAMPLE · {config.unit}</Text>
          </View>
        ) : latest ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.tileValue}>
              {readingValue(latest)}
            </Text>
            <Text style={ui.small}>{config.unit} · saved reading</Text>
          </View>
        ) : (
          <View style={{ gap: 4 }}>
            <Text style={styles.unit}>{config.unit}</Text>
            <Text style={ui.small}>No saved readings</Text>
          </View>
        )}
        {hasDraft && <Text style={styles.draftLabel}>Draft — not saved</Text>}
      </Pressable>
      <Button secondary onPress={() => router.push({ pathname: "/metric-history", params: { metric: config.type } })}>View {name.toLowerCase()} history</Button>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  overview: { gap: 22 },
  hero: {
    backgroundColor: C.blue,
    borderColor: C.blue,
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFFB3",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: C.title,
  },
  connection: { flexDirection: "row", gap: 9, alignItems: "flex-start" },
  previewControl: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionLabel: { fontSize: 16, fontWeight: "600", color: C.title },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "stretch",
  },
  tile: {
    flex: 1,
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 186,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tileName: { color: C.title, fontSize: 16, fontWeight: "600" },
  unit: { color: C.primaryDark, fontSize: 19, fontWeight: "600" },
  tileValue: {
    color: C.title,
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
  },
  sampleTag: {
    color: C.primaryDark,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  draftLabel: { color: C.primaryDark, fontSize: 12, fontWeight: "600" },
  empty: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 22,
    gap: 14,
  },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.mint,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomColor: C.border,
  },
  historyValue: {
    color: C.title,
    fontWeight: "600",
    fontSize: 21,
    fontVariant: ["tabular-nums"],
  },
});
