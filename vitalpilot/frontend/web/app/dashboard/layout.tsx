"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { api } from "../services/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(!api.isDemoMode());

  useEffect(() => {
    if (api.isDemoMode()) {
      return;
    }

    let cancelled = false;

    api.getMe().then((user) => {
      if (cancelled) {
        return;
      }

      if (!user) {
        router.replace("/signin");
      } else {
        setChecking(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 bg-fourth/5">
        {children}
      </main>
    </div>
  );
}
