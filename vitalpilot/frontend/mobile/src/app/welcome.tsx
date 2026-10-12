import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Brand, Button, ui } from "@/components/design/ui";
import { WelcomeStory } from "@/components/design/welcome-story";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const slides = [
  {
    eyebrow: "WELCOME TO VITALPILOT",
    title: "A little more clarity.\nA little more you.",
    description:
      "Meet your health companion: a place for your readings, everyday habits, and the questions that come with them.",
  },
  {
    eyebrow: "START WITH YOUR EVERYDAY",
    title: "Small check-ins.\nA fuller picture.",
    description:
      "Choose what matters to you—from blood pressure and glucose to sleep, water, and movement. Build a routine that fits your life.",
  },
  {
    eyebrow: "MAKE SENSE OF YOUR STORY",
    title: "More than numbers.\nRoom to understand.",
    description:
      "VitalPilot is being built to bring your readings into trends, reports, and helpful explanations. Start with the tools available today.",
  },
  {
    eyebrow: "TAKE YOUR NEXT STEP",
    title: "Your questions.\nYour care. Your pace.",
    description:
      "Find healthcare providers by location and specialty. Bring your questions to your next visit—searching never shares your health information.",
  },
];
export default function Welcome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [pageWidth, setPageWidth] = useState(width);
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(true);
  const list = useRef<ScrollView>(null);
  const position = useRef(new Animated.Value(0)).current;
  const current = useRef(0);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      list.current?.scrollTo({
        x: current.current * pageWidth,
        animated: false,
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [pageWidth]);
  function go(index: number) {
    list.current?.scrollTo({
      x: index * pageWidth,
      animated: !reduced,
    });
    current.current = index;
    setStep(index);
  }
  return (
    <SafeAreaView style={s.root} edges={["top", "bottom", "left", "right"]}>
      <View style={s.header}>
        <Brand />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip introduction and sign in"
          onPress={() => router.push("/signin")}
          style={s.skip}
        >
          <Text style={ui.link}>Skip</Text>
        </Pressable>
      </View>
      <View
        style={{ flex: 1 }}
        onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
      >
        <Animated.ScrollView
          ref={list}
          testID="welcome-carousel"
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: position } } }],
            {
              useNativeDriver: Platform.OS !== "web",
              listener: (event) => {
                const next = Math.max(
                  0,
                  Math.min(
                    slides.length - 1,
                    Math.round(
                      (
                        event as {
                          nativeEvent: { contentOffset: { x: number } };
                        }
                      ).nativeEvent.contentOffset.x / pageWidth,
                    ),
                  ),
                );
                if (current.current !== next) {
                  current.current = next;
                  setStep(next);
                }
              },
            },
          )}
        >
          {slides.map((item, index) => {
            const range = [
              (index - 1) * pageWidth,
              index * pageWidth,
              (index + 1) * pageWidth,
            ];
            return (
              <ScrollView
                key={item.eyebrow}
                style={{ width: pageWidth, flexGrow: 0, flexShrink: 0 }}
                contentContainerStyle={s.page}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                aria-hidden={step !== index}
                accessibilityElementsHidden={step !== index}
                importantForAccessibility={
                  step === index ? "auto" : "no-hide-descendants"
                }
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateX: reduced
                          ? 0
                          : position.interpolate({
                              inputRange: range,
                              outputRange: [32, 0, -32],
                              extrapolate: "clamp",
                            }),
                      },
                      {
                        scale: reduced
                          ? 1
                          : position.interpolate({
                              inputRange: range,
                              outputRange: [0.94, 1, 0.94],
                              extrapolate: "clamp",
                            }),
                      },
                    ],
                    opacity: reduced
                      ? 1
                      : position.interpolate({
                          inputRange: range,
                          outputRange: [0.45, 1, 0.45],
                          extrapolate: "clamp",
                        }),
                  }}
                >
                  <WelcomeStory page={index} />
                </Animated.View>
                <View style={{ gap: 16 }}>
                  <Text style={ui.eyebrow}>{item.eyebrow}</Text>
                  <Text accessibilityRole="header" style={s.title}>
                    {item.title}
                  </Text>
                  <Text style={ui.subtitle}>{item.description}</Text>
                </View>
              </ScrollView>
            );
          })}
        </Animated.ScrollView>
      </View>
      <View style={s.footer}>
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <View style={{ flexDirection: "row" }}>
            {slides.map((item, index) => (
              <Pressable
                key={item.eyebrow}
                accessibilityRole="button"
                accessibilityLabel={`Welcome page ${index + 1}: ${item.eyebrow.toLowerCase()}`}
                accessibilityState={{ selected: step === index }}
                onPress={() => go(index)}
                style={s.dotTouch}
              >
                <View
                  style={{
                    width: step === index ? 26 : 7,
                    height: 7,
                    borderRadius: 7,
                    backgroundColor: step === index ? C.primary : C.border,
                  }}
                />
              </Pressable>
            ))}
          </View>
          <Text accessibilityLiveRegion="polite" style={ui.small}>
            {step + 1} of {slides.length}
          </Text>
        </View>
        <Button
          icon="arrow"
          onPress={() =>
            step < slides.length - 1 ? go(step + 1) : router.push("/signup")
          }
        >
          {step === slides.length - 1 ? "Create account" : "Continue"}
        </Button>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/signin")}
          style={s.signin}
        >
          <Text style={ui.small}>
            Already have an account? <Text style={ui.link}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skip: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  page: {
    padding: 20,
    paddingBottom: 30,
    gap: 30,
    flexGrow: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  title: { fontSize: 32, fontWeight: "700", color: C.title, letterSpacing: -1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 2,
    gap: 4,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: C.background,
  },
  dotTouch: {
    width: 40,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  signin: { minHeight: 48, justifyContent: "center", alignItems: "center" },
});
