import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { VitalPilotLogo } from "@/components/vitalpilot/logo";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
let played = false;
export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(!played);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.94);
  const orbit = useSharedValue(0);
  const wordmark = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    opacity: orbit.value,
    transform: [
      { rotate: `${(1 - orbit.value) * -15}deg` },
      { scale: 0.9 + orbit.value * 0.1 },
    ],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: wordmark.value }));
  useEffect(() => {
    let active = true;
    const complete = () => {
      played = true;
      setVisible(false);
    };
    async function start() {
      if (Platform.OS !== "web") await SplashScreen.hideAsync().catch(() => {});
      const reduced = await AccessibilityInfo.isReduceMotionEnabled().catch(
        () => false,
      );
      if (!active || played) return;
      scale.value = withTiming(1, {
        duration: reduced ? 0 : 400,
        easing: Easing.out(Easing.cubic),
      });
      orbit.value = withTiming(1, { duration: reduced ? 0 : 650 });
      wordmark.value = withDelay(
        reduced ? 0 : 180,
        withTiming(1, { duration: reduced ? 0 : 300 }),
      );
      opacity.value = withDelay(
        reduced ? 50 : 750,
        withTiming(0, { duration: reduced ? 150 : 250 }, (finished) => {
          if (finished) runOnJS(complete)();
        }),
      );
    }
    start();
    return () => {
      active = false;
      [opacity, scale, orbit, wordmark].forEach(cancelAnimation);
    };
  }, [opacity, scale, orbit, wordmark]);
  if (!visible) return null;
  return (
    <Animated.View
      testID="startup-overlay"
      accessibilityLabel="Opening VitalPilot"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: C.background,
          zIndex: 9999,
          elevation: 20,
          justifyContent: "center",
          alignItems: "center",
        },
        overlayStyle,
      ]}
    >
      <View
        style={{
          width: 280,
          height: 280,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFill, orbitStyle]}>
          <View
            style={{
              position: "absolute",
              top: 26,
              left: 26,
              width: 228,
              height: 228,
              borderRadius: 114,
              backgroundColor: "#E4F1F7",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 62,
              width: 280,
              height: 155,
              borderWidth: 1.5,
              borderColor: "#70BAC8",
              borderRadius: 140,
              transform: [{ rotate: "-25deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 50,
              width: 180,
              height: 280,
              borderWidth: 1,
              borderColor: "#B6D5E6",
              borderRadius: 140,
              transform: [{ rotate: "25deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 45,
              right: 26,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: C.peach,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 44,
              left: 29,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: C.primary,
            }}
          />
        </Animated.View>
        <Animated.View style={logoStyle}>
          <VitalPilotLogo size={132} />
        </Animated.View>
      </View>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: "50%",
            marginTop: 160,
            gap: 8,
            alignItems: "center",
            paddingHorizontal: 24,
          },
          textStyle,
        ]}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: C.title,
            letterSpacing: -1,
          }}
        >
          VitalPilot
        </Text>
        <Text style={{ color: C.textSecondary, fontSize: 15 }}>
          Your health. A clearer picture.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
export function AnimatedIcon() {
  return <VitalPilotLogo size={100} />;
}
