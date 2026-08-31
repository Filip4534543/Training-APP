"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Cloud, HardDrive, LoaderCircle } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { Button } from "@/components/ui/button";
import { DAY_TONES, dayLabel, formatDateTime, formatSetsScheme, formatWeekday } from "@/lib/format";
import { lastCompletedForDay, workoutVolume } from "@/lib/progress";
import { getDay } from "@/lib/plan";
import { getWorkout } from "@/lib/state";
import type { DayId, DayPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HomeScreen() {
  const router = useRouter();
  const { state, status, error, reload, storage, startDay } = useAppState();
  const active = getWorkout(state, state.activeWorkoutId);

  function openDay(dayId: DayId) {
    const next = startDay(dayId);
    router.push(`/trening/${dayId}`);
    return next;
  }

  if (status === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <Image src="/logo.png" alt="" width={128} height={140} className="h-16 w-auto dark:invert" />
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Wczytuję plan i historię…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <Image src="/logo.png" alt="" width={112} height={122} className="h-14 w-auto dark:invert" />
        <h1 className="font-heading text-3xl tracking-wide uppercase">Brak połączenia</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => void reload()}>Spróbuj ponownie</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:pb-10">
      <section className="grid gap-2">
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          {formatWeekday()}
        </p>
        <h1 className="font-heading text-4xl leading-none tracking-wide uppercase sm:text-5xl">
          Wybierz dzień
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Cztery dni planu. W każdym ćwiczeniu dopiszesz ciężar i powtórzenia, a serie dodasz lub
          odejmiesz jednym tapnięciem. Po treningu zobaczysz progres względem poprzedniego razu.
        </p>
      </section>

      {active && getDay(state.plan, active.dayId) ? (
        <Link
          href={`/trening/${active.dayId}`}
          className="flex items-center justify-between gap-3 rounded-2xl bg-foreground px-4 py-4 text-background"
        >
          <div>
            <p className="text-[11px] tracking-widest uppercase opacity-70">Trening w toku</p>
            <p className="font-heading text-xl tracking-wide uppercase">
              {dayLabel(getDay(state.plan, active.dayId)!)}
            </p>
          </div>
          <ArrowRight className="size-5" />
        </Link>
      ) : null}

      <div className="grid gap-3">
        {state.plan.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            last={lastCompletedForDay(state.workouts, day.id)}
            onStart={() => openDay(day.id)}
          />
        ))}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {storage === "netlify-blobs" ? (
          <Cloud className="size-3.5" />
        ) : (
          <HardDrive className="size-3.5" />
        )}
        Zapis: {storage === "netlify-blobs" ? "Netlify Blobs" : "lokalny plik (dev)"}
        {state.workouts.filter((item) => item.completedAt).length > 0 ? (
          <>
            {" "}
            · ostatni trening{" "}
            {formatDateTime(
              [...state.workouts]
                .filter((item) => item.completedAt)
                .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0]
                .completedAt!,
            )}
          </>
        ) : null}
      </p>
    </div>
  );
}

function DayCard({
  day,
  last,
  onStart,
}: {
  day: DayPlan;
  last: ReturnType<typeof lastCompletedForDay>;
  onStart: () => void;
}) {
  const tone = DAY_TONES[day.tone];

  return (
    <article className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div className={cn("h-1.5", tone.bar)} />
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone.chip)}>
              {day.name}
            </span>
            <span className="text-sm text-muted-foreground">{day.focus}</span>
          </div>
          <ul className="mt-3 grid gap-1.5">
            {day.exercises.map((exercise) => (
              <li key={exercise.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{exercise.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatSetsScheme(exercise)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {last?.completedAt
              ? `Ostatnio ${formatDateTime(last.completedAt)} · ${Math.round(workoutVolume(last))} kg objętości`
              : "Jeszcze nie trenowany — to będzie punkt startowy."}
          </p>
        </div>
        <Button onClick={onStart} className="h-11 rounded-full px-5">
          Start
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </article>
  );
}
