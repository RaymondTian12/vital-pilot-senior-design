import { useState } from "react";
import { Text } from "react-native";
import { useRouter, type Href } from "expo-router";
import {
  Card,
  Empty,
  Field,
  Heading,
  Row,
  Screen,
  ui,
} from "@/components/design/ui";
import type { IconName } from "@/components/design/icon";
const tools: {
  group: string;
  title: string;
  detail: string;
  icon: IconName;
  href: Href;
}[] = [
  {
    group: "MONITOR",
    title: "Log vitals",
    detail: "Measurement entry · saving not available yet",
    icon: "vitals",
    href: "/metrics",
  },
  {
    group: "UNDERSTAND",
    title: "Pilot AI",
    detail: "Health explanations · preview available",
    icon: "sparkles",
    href: "/chatbot",
  },
  {
    group: "UNDERSTAND",
    title: "Health reports",
    detail: "Health summaries · preview available",
    icon: "report",
    href: "/reports",
  },
  {
    group: "CARE",
    title: "Find a doctor",
    detail: "Search the NPI provider directory",
    icon: "doctor",
    href: "/doctors",
  },
  {
    group: "ACCOUNT",
    title: "Your profile",
    detail: "Account and local preview settings",
    icon: "person",
    href: "/profile",
  },
];
export default function Explore() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const filtered = tools.filter((t) =>
    `${t.title} ${t.detail}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Screen back>
      <Heading title="Explore" subtitle="Your health tools, in one place." />
      <Field
        label="Search tools"
        placeholder="Search tools"
        value={query}
        onChangeText={setQuery}
      />
      {["MONITOR", "UNDERSTAND", "CARE", "ACCOUNT"].map((group) =>
        filtered.some((t) => t.group === group) ? (
          <Card key={group}>
            <Text style={ui.eyebrow}>{group}</Text>
            {filtered
              .filter((t) => t.group === group)
              .map((t) => (
                <Row key={t.title} {...t} onPress={() => router.push(t.href)} />
              ))}
          </Card>
        ) : null,
      )}
      {!filtered.length && (
        <Empty
          title="No matching tools"
          message="Try another search term."
          icon="search"
        />
      )}
    </Screen>
  );
}
