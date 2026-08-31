"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state-provider";
import { ChangeExerciseDialog } from "@/components/change-exercise-dialog";
import { Button } from "@/components/ui/button";
import { DAY_TONES, formatDate, formatSetsScheme } from "@/lib/format";
import { lastLoggedExercise } from "@/lib/progress";
import type { DayPlan, ExerciseTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ExercisesScreen() {
  const { state, renameExercise, resetExercise, status } = useAppState();
  const [editing, setEditing] = useState<{ day: DayPlan; exercise: ExerciseTemplate } | null>(
    null,
  );
  const catalog = useMemo(
    () => state.plan.flatMap((day) => day.exercises.map((exercise) => exercise.name)),
    [state.plan],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 pb-24">
      <header>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Plan
        </p>
        <h1 className="font-heading text-4xl tracking-wide uppercase">Ćwiczenia</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Zmień ćwiczenie ręcznie, gdy na sali nie ma sprzętu albo chcesz wariant. Od tego momentu
          ciężar i powtórzenia liczą się od zera — stary ruch zostaje w historii pod poprzednią nazwą.
        </p>
      </header>

      {status === "loading" ? (
        <p className="text-sm text-muted-foreground">Wczytuję plan…</p>
      ) : (
        <div className="grid gap-4">
          {state.plan.map((day) => {
            const tone = DAY_TONES[day.tone];
            return (
              <section key={day.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
                <div className={cn("h-1.5", tone.bar)} />
                <div className="px-4 pt-4">
                  <p className={cn("text-[11px] font-medium tracking-widest uppercase", tone.text)}>
                    {day.name}
                  </p>
                  <h2 className="font-heading text-2xl tracking-wide uppercase">{day.focus}</h2>
                </div>
                <ul className="divide-y divide-border/70 pt-2">
                  {day.exercises.map((exercise) => {
                    const last = lastLoggedExercise(state.workouts, exercise.name, exercise.since);
                    return (
                      <li key={exercise.id} className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{exercise.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatSetsScheme(exercise)}
                            {exercise.since
                              ? ` · od ${formatDate(exercise.since)} nowa historia`
                              : last
                                ? " · jest historia"
                                : " · brak historii"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setEditing({ day, exercise })}
                        >
                          Zmień
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {editing ? (
        <ChangeExerciseDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          day={editing.day}
          exercise={editing.exercise}
          catalog={catalog}
          onConfirm={(name) => renameExercise(editing.day.id, editing.exercise.id, name)}
          onRestore={() => resetExercise(editing.day.id, editing.exercise.id)}
        />
      ) : null}
    </div>
  );
}
