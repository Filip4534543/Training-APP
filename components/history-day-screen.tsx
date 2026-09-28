"use client";

import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { LineChart } from "@/components/line-chart";
import { Button } from "@/components/ui/button";
import { DAY_TONES, dayLabel, formatDateTime, formatKg, formatShortDate } from "@/lib/format";
import { getDay } from "@/lib/plan";
import { firstSetSeries, lastCompletedForDay } from "@/lib/progress";
import type { DayId, FirstSetPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

function firstSetCaption(point: FirstSetPoint) {
  if (point.unilateral) {
    return `L ${point.repsLeft ?? "—"} / P ${point.repsRight ?? "—"}`;
  }
  return `${point.reps ?? "—"} powt.`;
}

export function HistoryDayScreen({ dayId }: { dayId: DayId }) {
  const { profile, removeWorkout, status } = useAppState();
  const day = getDay(profile.plan, dayId);
  const sessions = [...profile.workouts]
    .filter((workout) => workout.dayId === dayId && workout.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  if (status === "loading" || !day) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4">
        <p className="text-sm text-muted-foreground">Wczytuję historię dnia…</p>
      </div>
    );
  }

  const tone = DAY_TONES[day.tone];
  const last = lastCompletedForDay(profile.workouts, dayId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6">
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/historia" />}
          aria-label="Historia"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <p className={cn("text-[11px] font-medium tracking-widest uppercase", tone.text)}>
            {profile.name} · 1. seria
          </p>
          <h1 className="font-heading text-2xl leading-tight tracking-wide uppercase sm:text-3xl">
            {dayLabel(day)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {last?.completedAt
              ? `Ostatnio ${formatDateTime(last.completedAt)}.`
              : "Ten dzień nie ma jeszcze zapisanych treningów."}
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-10 text-center ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl tracking-wide uppercase">Brak treningów</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Jak tylko skończysz ten dzień, tutaj pojawi się wykres pierwszej serii.
          </p>
          <Button className="mt-4" nativeButton={false} render={<Link href="/" />}>
            Otwórz plan
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {day.exercises.map((exercise) => {
            const series = firstSetSeries(
              profile.workouts,
              dayId,
              exercise.id,
              exercise.since,
            );
            const latest = series.at(-1);
            return (
              <section key={exercise.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-heading text-lg leading-tight tracking-wide uppercase">
                    {exercise.name}
                  </h2>
                  {latest ? (
                    <p className="shrink-0 text-xs text-muted-foreground">
                      ost. {formatKg(latest.weight)} kg × {firstSetCaption(latest)}
                    </p>
                  ) : null}
                </div>
                {series.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Brak zapisanej pierwszej serii.
                  </p>
                ) : (
                  <LineChart
                    className="mt-3"
                    points={series.map((point) => ({
                      label: formatShortDate(point.at),
                      value: point.weight ?? 0,
                      caption: firstSetCaption(point),
                    }))}
                  />
                )}
              </section>
            );
          })}
        </div>
      )}

      {sessions.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="font-heading text-lg tracking-wide uppercase">Treningi</h2>
          <ul className="grid gap-2">
            {sessions.map((workout) => (
              <li
                key={workout.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-card px-3 py-3 ring-1 ring-foreground/10"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {workout.completedAt ? formatDateTime(workout.completedAt) : "Trening"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {workout.exercises.length} ćwiczeń
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 text-destructive hover:text-destructive"
                  aria-label="Usuń trening"
                  onClick={() => {
                    const when = workout.completedAt ? formatDateTime(workout.completedAt) : "";
                    if (window.confirm(`Usunąć trening z ${when}?`)) {
                      removeWorkout(workout.id);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
