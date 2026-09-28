"use client";

import Link from "next/link";
import { useAppState } from "@/components/app-state-provider";
import { Button } from "@/components/ui/button";
import { DAY_TONES, dayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function HistoryScreen() {
  const { profile, status } = useAppState();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6">
      <header>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          {profile.name}
        </p>
        <h1 className="font-heading text-3xl tracking-wide uppercase sm:text-4xl">Historia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wejdź w dzień, żeby zobaczyć pierwszą serię każdego ćwiczenia na przestrzeni treningów.
        </p>
      </header>

      {status === "loading" ? (
        <p className="text-sm text-muted-foreground">Wczytuję historię…</p>
      ) : (
        <div className="grid gap-3">
          {profile.plan.map((day) => {
            const tone = DAY_TONES[day.tone];
            const count = profile.workouts.filter(
              (workout) => workout.dayId === day.id && workout.completedAt,
            ).length;
            return (
              <Link
                key={day.id}
                href={`/historia/${day.id}`}
                className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-colors active:bg-muted/40 hover:bg-muted/40"
              >
                <div className={cn("h-1.5", tone.bar)} />
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <h2 className="font-heading text-xl tracking-wide uppercase">{dayLabel(day)}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {count === 0
                        ? "Jeszcze bez treningów tego dnia."
                        : `${count} ${count === 1 ? "trening" : count < 5 ? "treningi" : "treningów"}`}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone.chip)}>
                    {day.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {status !== "loading" &&
      profile.workouts.filter((workout) => workout.completedAt).length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-8 text-center ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl tracking-wide uppercase">Jeszcze pusto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dokończ pierwszy trening, a tutaj pojawią się wykresy pierwszej serii.
          </p>
          <Button className="mt-4" nativeButton={false} render={<Link href="/" />}>
            Otwórz plan
          </Button>
        </div>
      ) : null}
    </div>
  );
}
