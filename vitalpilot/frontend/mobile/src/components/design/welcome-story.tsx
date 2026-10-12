import { Text, View, StyleSheet } from "react-native";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { Icon } from "./icon";
import { Orbit, ui } from "./ui";
import { Sparkline } from "./charts";

export function WelcomeStory({ page }: { page: number }) {
  return (
    <View
      style={s.stage}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          s.halo,
          {
            backgroundColor: ["#E0F0F4", "#E4F3EE", "#E5EDF8", "#F8ECE3"][page],
          },
        ]}
      />
      {page === 0 ? (
        <>
          <Orbit size={210} logo />
          <View style={[s.floating, s.lower]}>
            <Icon name="vitals" />
            <Text style={s.caption}>Your readings, together</Text>
            <Icon name="check" size={18} />
          </View>
        </>
      ) : null}
      {page === 1 ? (
        <>
          <View style={s.phone}>
            <Text style={s.caption}>A simple daily check-in</Text>
            <View style={[ui.row, { justifyContent: "space-between" }]}>
              <Icon name="vitals" />
              <Text style={s.caption}>Blood pressure</Text>
            </View>
            <View style={ui.row}>
              <View style={s.input}>
                <Text style={s.number}>120</Text>
                <Text style={ui.small}>Systolic</Text>
              </View>
              <View style={s.input}>
                <Text style={s.number}>80</Text>
                <Text style={ui.small}>Diastolic</Text>
              </View>
            </View>
            <Text style={s.example}>Example · mmHg</Text>
            <View style={s.mockButton}>
              <Text style={{ color: C.white, fontWeight: "600" }}>
                One reading at a time
              </Text>
            </View>
          </View>
        </>
      ) : null}
      {page === 2 ? (
        <>
          <View style={[s.phone, { padding: 22 }]}>
            <View style={ui.row}>
              <Icon name="chart" />
              <Text style={s.caption}>See your story unfold</Text>
            </View>
            <Text style={s.number}>A week in view</Text>
            <Sparkline values={[6, 6.5, 6, 7, 7.5, 7, 8]} />
            <View style={[ui.row, { justifyContent: "space-between" }]}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <Text key={i} style={s.example}>
                  {day}
                </Text>
              ))}
            </View>
            <Text style={s.example}>Illustrative trend</Text>
          </View>
          <View style={[s.floating, s.lower]}>
            <Icon name="sparkles" />
            <Text style={s.caption}>Turn questions into understanding</Text>
          </View>
        </>
      ) : null}
      {page === 3 ? (
        <>
          <View style={s.phone}>
            <View style={ui.row}>
              <View style={s.avatar}>
                <Icon name="doctor" size={28} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.caption}>Find care near you</Text>
                <Text style={ui.small}>Search by location and specialty</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={ui.row}>
              <Icon name="pin" size={18} />
              <Text style={ui.small}>Your city. Your next step.</Text>
            </View>
            <View style={s.mockButton}>
              <Text style={{ color: C.white, fontWeight: "600" }}>
                Feel prepared for your visit
              </Text>
            </View>
          </View>
          <View style={[s.floating, s.lower]}>
            <Icon name="lock" size={18} />
            <Text style={s.caption}>Searching never shares your data</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  stage: {
    height: 290,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  halo: { position: "absolute", width: 240, height: 240, borderRadius: 120 },
  phone: {
    width: "92%",
    maxWidth: 310,
    backgroundColor: C.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    gap: 16,
    shadowColor: "#255E70",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  floating: {
    position: "absolute",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
  },
  lower: { bottom: 0 },
  upper: { top: 0 },
  caption: { fontSize: 13, color: C.title, fontWeight: "600", flexShrink: 1 },
  number: {
    fontSize: 22,
    fontWeight: "700",
    color: C.title,
    letterSpacing: -0.5,
  },
  input: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: 12,
    padding: 12,
    gap: 3,
  },
  example: { fontSize: 11, color: C.textSecondary },
  mockButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },
  avatar: { backgroundColor: C.mint, padding: 12, borderRadius: 16 },
  divider: { height: 1, backgroundColor: C.border },
});
