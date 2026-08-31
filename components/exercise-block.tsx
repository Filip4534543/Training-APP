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
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            Ćwiczenie {index + 1} · {formatSetsScheme(exercise)}
          </p>
          <h2 className="font-heading text-xl leading-tight tracking-wide uppercase">
            {exercise.name}
          </h2>
          {lastHint ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Ostatnio: {formatKg(lastHint.weight)} kg × {lastHint.reps ?? "—"}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Brak historii — statystyki liczą się od tej sesji.
            </p>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRename} aria-label="Zmień ćwiczenie">
          <Pencil className="size-4" />
        </Button>
      </header>

      <div className="mt-3 divide-y divide-border/70">
        {exercise.sets.map((set, setIndex) => (
          <div key={set.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
            <div className="flex items-center justify-between sm:block">
              <p className="font-heading text-sm tracking-wide text-muted-foreground uppercase">
                Seria {setIndex + 1}
              </p>
              {exercise.sets.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="sm:hidden"
                  onClick={() => onRemoveSet(set.id)}
                  aria-label="Usuń serię"
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <StepperField
                label="Ciężar"
                value={set.weight}
                step={2.5}
                suffix="kg"
                placeholder={lastHint?.weight != null ? formatKg(lastHint.weight) : "0"}
                onChange={(weight) => onChangeSet(set.id, { weight })}
              />
              <StepperField
                label="Powtórzenia"
                value={set.reps}
                step={1}
                suffix="powt."
                placeholder={lastHint?.reps != null ? String(lastHint.reps) : String(exercise.repsMin)}
                onChange={(reps) =>
                  onChangeSet(set.id, {
                    reps: reps === null ? null : Math.round(reps),
                  })
                }
              />
            </div>
            {exercise.sets.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                onClick={() => onRemoveSet(set.id)}
                aria-label="Usuń serię"
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {logged}/{exercise.sets.length} serii z wynikiem
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onAddSet} className="h-9">
          <Plus data-icon="inline-start" />
          Dodaj serię
        </Button>
      </div>
    </section>
  );
}
