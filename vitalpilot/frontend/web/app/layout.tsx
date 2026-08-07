import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitalPilot",
  description:
    "VitalPilot is a full-stack software architecture combining a TypeScript frontend, a Python backend engine, and a relational database for personalized health monitoring. Developed for CSE 4316-17 Senior Design at UT Arlington (Summer 2026 - Fall 2026).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
