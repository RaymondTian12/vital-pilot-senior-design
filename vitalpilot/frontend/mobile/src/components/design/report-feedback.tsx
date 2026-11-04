import { useEffect } from "react";
import { AccessibilityInfo, ActivityIndicator, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from "react-native-reanimated";
import { useMotionPreference } from "./motion";
import { Icon } from "./icon";
import { ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

export type ReportPhase = "generating" | "ready" | "error";

// The caller must set `ready` only after the PDF file has been created.
export function ReportFeedback({ phase, preview = false }: { phase: ReportPhase; preview?: boolean }) {
  const reduced = useMotionPreference();
  const pulse = useSharedValue(1);
  const reveal = useSharedValue(0);
  const badge = useSharedValue(0.7);
  useEffect(() => {
    cancelAnimation(pulse);
    pulse.value = 1;
    if (phase === "generating" && !reduced) {
      pulse.value = withRepeat(withTiming(0.55, { duration: 850, easing: Easing.inOut(Easing.quad) }), -1, true);
    }
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: reduced ? 100 : 280 });
    badge.value = reduced ? 1 : 0.7;
    badge.value = reduced ? 1 : withSpring(1, { damping: 12, stiffness: 190 });
    const message = phase === "ready"
      ? preview ? "Animation preview complete. No PDF was created." : "Your PDF report is ready."
      : phase === "error" ? "Report could not be created. Please try again." : "Preparing your report.";
    AccessibilityInfo.announceForAccessibility(message);
    return () => { cancelAnimation(pulse); cancelAnimation(reveal); cancelAnimation(badge); };
  }, [phase, reduced, preview, pulse, reveal, badge]);
  const containerStyle = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: reduced ? 0 : (1 - reveal.value) * 10 }] }));
  const documentStyle = useAnimatedStyle(() => ({ opacity: phase === "generating" ? pulse.value : 1 }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));
  const ready = phase === "ready";
  return (
    <Animated.View style={[{ padding: 22, borderWidth: 1, borderColor: C.border, borderRadius: 22, backgroundColor: C.white, gap: 18, alignItems: "center" }, containerStyle]}>
      {preview && <Text style={[ui.eyebrow, { color: C.textSecondary }]}>ANIMATION PREVIEW · NO PDF CREATED</Text>}
      <View style={{ width: 92, height: 92, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[{ width: 76, height: 86, borderRadius: 18, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" }, documentStyle]}>
          <Icon name="report" size={40} color={C.primaryDark} />
        </Animated.View>
        {ready && <Animated.View style={[{ position: "absolute", right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: C.primaryDark, borderWidth: 3, borderColor: C.white, alignItems: "center", justifyContent: "center" }, badgeStyle]}><Icon name="check" size={19} color={C.white} /></Animated.View>}
      </View>
      <View style={{ gap: 6, alignItems: "center" }}>
        <Text style={[ui.heading, { textAlign: "center" }]}>{ready ? preview ? "That’s the finishing touch" : "Your PDF is ready" : phase === "error" ? "Let’s try that again" : preview ? "Previewing report preparation…" : "Preparing your report…"}</Text>
        <Text style={[ui.small, { textAlign: "center" }]}>{ready ? preview ? "A gentle checkmark will confirm when a real report is ready." : "Your health summary is ready to open or share." : phase === "error" ? "We couldn’t create the PDF. Your saved readings are still available." : preview ? "This demonstrates the motion only." : "Gathering your saved readings into one clear summary."}</Text>
      </View>
      {phase === "generating" && <ActivityIndicator color={C.primary} accessibilityLabel="Preparing report" />}
    </Animated.View>
  );
}
