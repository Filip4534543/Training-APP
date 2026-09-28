"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutGrid, ListChecks, Scale } from "lucide-react";
import { InstallAppButton } from "@/components/install-app-button";
import { Logo } from "@/components/logo";
import { ProfileSwitcher } from "@/components/profile-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Plan", icon: LayoutGrid },
  { href: "/historia", label: "Historia", icon: History },
  { href: "/waga", label: "Waga", icon: Scale },
  { href: "/cwiczenia", label: "Ćwiczenia", icon: ListChecks },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-3 sm:h-14 sm:px-4">
        <Link href="/" className="min-w-0">
          <Logo showWordmark={false} markClassName="h-6 sm:h-7" />
        </Link>
        <div className="flex items-center gap-1.5">
          <ProfileSwitcher />
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <InstallAppButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function AppTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/trening")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-4 px-1">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
