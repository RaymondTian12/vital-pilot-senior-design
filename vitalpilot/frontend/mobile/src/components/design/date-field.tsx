import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Button, ui } from "./ui";
import { Icon } from "./icon";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [part, setPart] = useState<"month" | "day" | "year" | null>(null);
  const [year, setYear] = useState(2000);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const today = new Date();
  const maxDay = new Date(year, month, 0).getDate();
  const options =
    part === "month"
      ? months.map((label, i) => ({ label, value: i + 1 }))
      : part === "year"
        ? Array.from({ length: today.getFullYear() - 1899 }, (_, i) => ({
            label: String(today.getFullYear() - i),
            value: today.getFullYear() - i,
          }))
        : Array.from({ length: maxDay }, (_, i) => ({
            label: String(i + 1),
            value: i + 1,
          }));
  const draft = `${year}-${String(month).padStart(2, "0")}-${String(Math.min(day, maxDay)).padStart(2, "0")}`;
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.body}>Date of birth</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Date of birth, ${value || "choose a date"}`}
        onPress={() => {
          if (value) {
            const [y, m, d] = value.split("-").map(Number);
            setYear(y);
            setMonth(m);
            setDay(d);
          }
          setPart(null);
          setOpen(true);
        }}
        style={[
          ui.row,
          {
            minHeight: 54,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 14,
            padding: 15,
            backgroundColor: C.white,
            justifyContent: "space-between",
          },
        ]}
      >
        <Text style={ui.body}>
          {value
            ? `${months[Number(value.slice(5, 7)) - 1]} ${Number(value.slice(8))}, ${value.slice(0, 4)}`
            : "Choose your birth date"}
        </Text>
        <Icon name="calendar" />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#142A3566",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: C.background,
              borderRadius: 24,
              padding: 20,
              gap: 16,
              maxHeight: "85%",
              width: "100%",
              maxWidth: 500,
              alignSelf: "center",
            }}
          >
            <Text style={ui.heading}>Your date of birth</Text>
            <Text style={ui.small}>Choose a month, day, and year.</Text>
            <View style={[ui.row, { flexWrap: "wrap" }]}>
              {(["month", "day", "year"] as const).map((p) => (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${p}`}
                  accessibilityState={{ expanded: part === p }}
                  onPress={() => setPart(part === p ? null : p)}
                  style={{
                    flexGrow: 1,
                    minHeight: 54,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: part === p ? C.primary : C.border,
                    backgroundColor: C.white,
                  }}
                >
                  <Text style={ui.small}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </Text>
                  <Text style={ui.body}>
                    {p === "month"
                      ? months[month - 1]
                      : p === "year"
                        ? year
                        : Math.min(day, maxDay)}{" "}
                    ▾
                  </Text>
                </Pressable>
              ))}
            </View>
            {part && (
              <ScrollView
                style={{ maxHeight: 240, flexGrow: 0 }}
                keyboardShouldPersistTaps="handled"
              >
                {options.map((o) => (
                  <Pressable
                    key={o.value}
                    accessibilityRole="button"
                    accessibilityLabel={`${part} ${o.label}`}
                    onPress={() => {
                      if (part === "month") setMonth(o.value);
                      else if (part === "year") setYear(o.value);
                      else setDay(o.value);
                      setPart(null);
                    }}
                    style={{
                      padding: 14,
                      minHeight: 48,
                      borderBottomWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <Text style={ui.body}>{o.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {draft > todayValue && (
              <Text style={ui.small}>Choose a date no later than today.</Text>
            )}
            <Button
              disabled={draft > todayValue}
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              Use this date
            </Button>
            <Button secondary onPress={() => setOpen(false)}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}
