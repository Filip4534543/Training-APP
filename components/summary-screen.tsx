"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Repeat2 } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { ProgressReport } from "@/components/progress-report";
import { Button } from "@/components/ui/button";
import { dayLabel, formatDateTime } from "@/lib/format";
import { getDay } from "@/lib/plan";
import { compareWorkouts, lastCompletedForDay, workoutVolume } from "@/lib/progress";
import type { DayId } from "@/lib/types";

export function SummaryScreen({ dayId }: { dayId: DayId }) {
  const searchParams = useSearchParams();
  const { profile, startDay } = useAppState();
  const workoutId = searchParams.get("id");
  const workout =
    profile.workouts.find((item) => item.id === workoutId) ??
    profile.workouts.find((item) => item.dayId === dayId && item.completedAt) ??
    null;
  const day = getDay(profile.plan, dayId);

  if (!workout || !day) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-heading text-3xl tracking-wide uppercase">Brak podsumowania</h1>
        <p className="text-sm text-muted-foreground">
          Najpierw dokończ trening, żeby porównać go z poprzednim dniem.
        </p>
        <Button nativeButton={false} render={<Link href="/" />}>
          Wróć do planu
        </Button>
      </div>
    );
  }

  const previous = lastCompletedForDay(profile.workouts, dayId, workout.id);
  const progress = compareWorkouts(workout, previous);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6">
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/" />}
          aria-label="Plan"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            {workout.completedAt ? formatDateTime(workout.completedAt) : "Dziś"}
          </p>
          <h1 className="font-heading text-2xl leading-tight tracking-wide uppercase sm:text-3xl">
            Progres · {dayLabel(day)}
          </h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Dzisiejsza objętość: {Math.round(workoutVolume(workout))} kg.
        {previous
          ? ` Poprzedni ${day.name.toLowerCase()} zapisałeś ${formatDateTime(previous.completedAt!)}.`
          : " To pierwszy zapisany trening tego dnia."}
      </p>

      <ProgressReport progress={progress} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-12 flex-1"
          nativeButton={false}
          onClick={() => startDay(dayId)}
          render={<Link href={`/trening/${dayId}`} />}
        >
          <Repeat2 data-icon="inline-start" />
          Trenuj ten dzień jeszcze raz
        </Button>
        <Button
          variant="outline"
          className="h-12 flex-1"
          nativeButton={false}
          render={<Link href="/historia" />}
        >
          Historia
        </Button>
      </div>
    </div>
  );
}
