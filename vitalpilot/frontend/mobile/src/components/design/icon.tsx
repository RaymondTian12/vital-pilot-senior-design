import { Image } from "expo-image";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const paths = {
  home: "M3 10 12 3 21 10v10h-6v-6H9v6H3z",
  vitals: "M3 12h4l3-7 4 14 3-7h4",
  sparkles: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
  report: "M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6",
  person: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2",
  bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4 M12 2v2",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  back: "m15 5-7 7 7 7",
  chevron: "m9 5 7 7-7 7",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11",
  water: "M12 3C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-12z",
  heart: "M12 21 3 12C-2 4 8 0 12 7c4-7 14-3 9 5z",
  search: "M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M16 16l6 6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  lock: "M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4 M12 14v3",
  mail: "M3 5h18v14H3z m0 0 9 8 9-8",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 11v6 M12 7v.2",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  doctor:
    "M5 3v5a5 5 0 0 0 10 0V3 M3 3h4 M13 3h4 M10 13v3a5 5 0 0 0 10 0v-3 M22 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  pin: "M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 0 1 14 0 M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  phone: "M5 3h4l2 5-3 2c1 3 3 5 6 6l2-3 5 2v4c-8 3-21-10-16-16z",
  calendar: "M3 5h18v16H3z M3 10h18 M7 2v6 M17 2v6",
  logout: "M10 3H3v18h7 M8 12h13 m-5-5 5 5-5 5",
  check: "m4 12 5 5L20 6",
  chart: "M5 21V12 M12 21V3 M19 21V8",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 22,
  color = C.primary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${paths[name]}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <Image
      source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
