"use client";

import { usePathname } from "next/navigation";
import { AppHeader, AppTabBar } from "@/components/app-chrome";
import { PwaRegister } from "@/components/pwa-register";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const liveWorkout = /^\/trening\/[1-2]$/.test(pathname);

  return (
    <>
      <PwaRegister />
      {liveWorkout ? null : <AppHeader />}
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          liveWorkout ? "" : "pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0",
        )}
      >
        {children}
      </main>
      <AppTabBar />
    </>
  );
}
