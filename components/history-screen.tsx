"use client";

import Link from "next/link";
import { useAppState } from "@/components/app-state-provider";
import { Button } from "@/components/ui/button";
import { DAY_TONES, dayLabel, formatDateTime, formatVolume } from "@/lib/format";
import { getDay } from "@/lib/plan";
import { workoutVolume } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function HistoryScreen() {
  const { state, status } = useAppState();
  const completed = [...state.workouts]
    .filter((workout) => workout.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6">
      <header>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Dziennik
        </p>
        <h1 className="font-heading text-3xl tracking-wide uppercase sm:text-4xl">Historia</h1>
        <p className="mt-2 hidden text-sm text-muted-foreground sm:block">
          Każdy ukończony trening. Wejdź w podsumowanie, żeby zobaczyć progres względem
          wcześniejszego dnia tego samego planu.
        </p>
      </header>

      {status === "loading" ? (
        <p className="text-sm text-muted-foreground">Wczytuję historię…</p>
      ) : completed.length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-10 text-center ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl tracking-wide uppercase">Jeszcze pusto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dokończ pierwszy trening, a tutaj pojawi się porównanie ciężarów i serii.
          </p>
          <Button className="mt-4" nativeButton={false} render={<Link href="/" />}>
            Otwórz plan
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {completed.map((workout) => {
            const day = getDay(state.plan, workout.dayId);
            if (!day) return null;
            const tone = DAY_TONES[day.tone];
            return (
              <Link
                key={workout.id}
                href={`/trening/${workout.dayId}/podsumowanie?id=${workout.id}`}
                className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-colors active:bg-muted/40 hover:bg-muted/40"
              >
                <div className={cn("h-1", tone.bar)} />
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {workout.completedAt ? formatDateTime(workout.completedAt) : ""}
                    </p>
                    <h2 className="font-heading text-xl tracking-wide uppercase">
                      {dayLabel(day)}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {workout.exercises.length} ćwiczeń · {formatVolume(workoutVolume(workout))}
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
    </div>
  );
}
