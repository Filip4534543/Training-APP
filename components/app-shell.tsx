"use client";

import { usePathname } from "next/navigation";
import { AppHeader, AppTabBar } from "@/components/app-chrome";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const liveWorkout = /^\/trening\/[1-4]$/.test(pathname);

  return (
    <>
      {liveWorkout ? null : <AppHeader />}
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <AppTabBar />
    </>
  );
}
