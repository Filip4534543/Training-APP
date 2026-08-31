"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { ChangeExerciseDialog } from "@/components/change-exercise-dialog";
import { ExerciseBlock } from "@/components/exercise-block";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DAY_TONES, dayLabel } from "@/lib/format";
import { getDay } from "@/lib/plan";
import { lastLoggedExercise } from "@/lib/progress";
import { getWorkout } from "@/lib/state";
import type { DayId, ExerciseTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WorkoutScreen({ dayId }: { dayId: DayId }) {
  const router = useRouter();
  const {
    state,
    startDay,
    discardActive,
    patchSet,
    addExerciseSet,
    removeExerciseSet,
    finishWorkout,
    renameExercise,
    resetExercise,
    status,
  } = useAppState();
  const [renaming, setRenaming] = useState<ExerciseTemplate | null>(null);

  const day = getDay(state.plan, dayId);
  const workout = useMemo(() => {
    const active = getWorkout(state, state.activeWorkoutId);
    if (active && active.dayId === dayId) return active;
    return null;
  }, [dayId, state]);

  const catalog = useMemo(
    () => state.plan.flatMap((item) => item.exercises.map((exercise) => exercise.name)),
    [state.plan],
  );

  if (status === "loading" || !day) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Logo />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-3xl tracking-wide uppercase">{dayLabel(day)}</h1>
        <p className="text-sm text-muted-foreground">
          Ten trening nie jest jeszcze rozpoczęty.
        </p>
        <Button
          onClick={() => {
            startDay(dayId);
          }}
        >
          Rozpocznij trening
        </Button>
        <Button variant="ghost" onClick={() => router.push("/")}>
          Wróć do planu
        </Button>
      </div>
    );
  }

  const tone = DAY_TONES[day.tone];
  const loggedSets = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.reps && set.reps > 0).length,
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-28">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            aria-label="Wróć"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className={cn("text-[11px] font-medium tracking-widest uppercase", tone.text)}>
              {day.name}
            </p>
            <h1 className="truncate font-heading text-lg leading-none tracking-wide uppercase">
              {day.focus}
            </h1>
          </div>
          <ThemeToggle />
        </div>
        <div className={cn("h-1", tone.bar)} />
      </header>

      <div className="grid gap-4 px-4 py-4">
        {workout.exercises.map((exercise, index) => {
          const previous = lastLoggedExercise(
            state.workouts,
            exercise.name,
            exercise.since,
            workout.id,
          );
          const lastSet = previous?.sets.filter((set) => set.reps && set.reps > 0).at(-1);
          const template = day.exercises.find((item) => item.id === exercise.slotId) ?? {
            ...exercise,
            id: exercise.slotId,
          };
          return (
            <ExerciseBlock
              key={exercise.slotId}
              index={index}
              exercise={exercise}
              lastHint={
                lastSet
                  ? { weight: lastSet.weight, reps: lastSet.reps }
                  : null
              }
              onChangeSet={(setId, patch) =>
                patchSet(workout.id, exercise.slotId, setId, patch)
              }
              onAddSet={() => addExerciseSet(workout.id, exercise.slotId)}
              onRemoveSet={(setId) => removeExerciseSet(workout.id, exercise.slotId, setId)}
              onRename={() => setRenaming(template)}
            />
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 pb-[env(safe-area-inset-bottom)]">
          <Button
            type="button"
            variant="ghost"
            className="h-12"
            onClick={() => {
              discardActive();
              router.push("/");
            }}
          >
            <X data-icon="inline-start" />
            Anuluj
          </Button>
          <Button
            type="button"
            className="h-12 flex-1 rounded-full"
            onClick={async () => {
              await finishWorkout(workout.id);
              router.push(`/trening/${dayId}/podsumowanie?id=${workout.id}`);
            }}
          >
            <Check data-icon="inline-start" />
            Zakończ trening · {loggedSets === 1 ? "1 seria" : loggedSets < 5 ? `${loggedSets} serie` : `${loggedSets} serii`}
          </Button>
        </div>
      </div>

      {renaming ? (
        <ChangeExerciseDialog
          open
          onOpenChange={(open) => {
            if (!open) setRenaming(null);
          }}
          day={day}
          exercise={renaming}
          catalog={catalog}
          onConfirm={(name) => renameExercise(dayId, renaming.id, name)}
          onRestore={() => resetExercise(dayId, renaming.id)}
        />
      ) : null}
    </div>
  );
}
