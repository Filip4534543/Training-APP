"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepperField } from "@/components/stepper-field";
import { formatKg, formatSetsScheme } from "@/lib/format";
import { filledSets } from "@/lib/progress";
import type { WorkoutExercise } from "@/lib/types";

type Props = {
  index: number;
  exercise: WorkoutExercise;
  lastHint?: { weight: number | null; reps: number | null } | null;
  onChangeSet: (setId: string, patch: { weight?: number | null; reps?: number | null }) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRename: () => void;
};

export function ExerciseBlock({
  index,
  exercise,
  lastHint,
  onChangeSet,
  onAddSet,
  onRemoveSet,
  onRename,
}: Props) {
  const logged = filledSets(exercise.sets).length;

  return (
    <section className="rounded-2xl bg-card ring-1 ring-foreground/10">
      <header className="flex items-start justify-between gap-2 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            {index + 1} · {formatSetsScheme(exercise)}
          </p>
          <h2 className="font-heading text-lg leading-tight tracking-wide uppercase sm:text-xl">
            {exercise.name}
          </h2>
          {lastHint ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Ostatnio: {formatKg(lastHint.weight)} kg × {lastHint.reps ?? "—"}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Brak historii — od tej sesji.</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0"
          onClick={onRename}
          aria-label="Zmień ćwiczenie"
        >
          <Pencil className="size-4" />
        </Button>
      </header>

      <div className="mt-2">
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-1 px-2 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:px-3">
          <span className="text-center">#</span>
          <span className="text-center">Ciężar</span>
          <span className="text-center">Powt.</span>
          <span />
        </div>
        <div className="divide-y divide-border/70">
          {exercise.sets.map((set, setIndex) => (
            <div
              key={set.id}
              className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-1 px-2 py-1.5 sm:px-3"
            >
              <p className="text-center font-heading text-sm text-muted-foreground">
                {setIndex + 1}
              </p>
              <StepperField
                label={`Ciężar, seria ${setIndex + 1}`}
                value={set.weight}
                step={2.5}
                suffix="kg"
                placeholder={lastHint?.weight != null ? formatKg(lastHint.weight) : "0"}
                onChange={(weight) => onChangeSet(set.id, { weight })}
              />
              <StepperField
                label={`Powtórzenia, seria ${setIndex + 1}`}
                value={set.reps}
                step={1}
                suffix=""
                placeholder={lastHint?.reps != null ? String(lastHint.reps) : String(exercise.repsMin)}
                onChange={(reps) =>
                  onChangeSet(set.id, {
                    reps: reps === null ? null : Math.round(reps),
                  })
                }
              />
              {exercise.sets.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 justify-self-center"
                  onClick={() => onRemoveSet(set.id)}
                  aria-label="Usuń serię"
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
        <p className="text-xs text-muted-foreground">
          {logged}/{exercise.sets.length} z wynikiem
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onAddSet} className="h-9">
          <Plus data-icon="inline-start" />
          Seria
        </Button>
      </div>
    </section>
  );
}
