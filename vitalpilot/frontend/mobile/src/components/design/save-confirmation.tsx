import { useEffect, type ReactNode } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Icon } from "./icon";
import { ui } from "./ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

// Confirms persistence only; the clinical result keeps its own severity styling.
export function SaveConfirmation({ children, animate, reducedMotion }: {
  children: ReactNode;
  animate: boolean;
  reducedMotion: boolean;
}) {
  const reveal = useSharedValue(animate ? 0 : 1);
  const check = useSharedValue(animate && !reducedMotion ? 0.6 : 1);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: reducedMotion ? 100 : 260 });
    check.value = reducedMotion ? 1 : withSpring(1, { damping: 13, stiffness: 220 });
    if (animate) AccessibilityInfo.announceForAccessibility("Reading saved to your account.");
    return () => { cancelAnimation(reveal); cancelAnimation(check); };
  }, [animate, reducedMotion, reveal, check]);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - reveal.value) * 12 }],
  }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: check.value }] }));
  return (
    <Animated.View style={[{ gap: 14 }, contentStyle]}>
      <View style={[ui.row, { gap: 10 }]}>
        <Animated.View accessible={false} style={[{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: C.mint, alignItems: "center", justifyContent: "center",
        }, checkStyle]}>
          <Icon name="check" size={23} color={C.primaryDark} />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={[ui.body, { fontWeight: "700" }]}>Reading saved</Text>
          <Text style={ui.small}>Saved to your account</Text>
        </View>
      </View>
      {children}
    </Animated.View>
  );
}
