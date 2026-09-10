"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepperField } from "@/components/stepper-field";
import { formatKg, formatSetsScheme } from "@/lib/format";
import { isUnilateral } from "@/lib/plan";
import { filledSets } from "@/lib/progress";
import type { WorkoutExercise } from "@/lib/types";
import { cn } from "@/lib/utils";

export type LastHint = {
  weight: number | null;
  reps: number | null;
  repsLeft?: number | null;
  repsRight?: number | null;
};

type Props = {
  index: number;
  exercise: WorkoutExercise;
  lastHint?: LastHint | null;
  onChangeSet: (
    setId: string,
    patch: {
      weight?: number | null;
      reps?: number | null;
      repsLeft?: number | null;
      repsRight?: number | null;
    },
  ) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRename: () => void;
};

function lastHintLabel(lastHint: LastHint, unilateral: boolean) {
  if (unilateral) {
    return `Ostatnio: ${formatKg(lastHint.weight)} kg × L ${lastHint.repsLeft ?? "—"} / P ${lastHint.repsRight ?? "—"}`;
  }
  return `Ostatnio: ${formatKg(lastHint.weight)} kg × ${lastHint.reps ?? "—"}`;
}

export function ExerciseBlock({
  index,
  exercise,
  lastHint,
  onChangeSet,
  onAddSet,
  onRemoveSet,
  onRename,
}: Props) {
  const unilateral = isUnilateral(exercise);
  const logged = filledSets(exercise.sets, unilateral).length;

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
            <p className="mt-1 text-xs text-muted-foreground">{lastHintLabel(lastHint, unilateral)}</p>
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
        <div
          className={cn(
            "grid items-center gap-1 px-2 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:px-3",
            unilateral
              ? "grid-cols-[2rem_minmax(0,1fr)_2.25rem]"
              : "grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem]",
          )}
        >
          <span className="text-center">#</span>
          {unilateral ? (
            <span className="text-center">Ciężar · L / P</span>
          ) : (
            <>
              <span className="text-center">Ciężar</span>
              <span className="text-center">Powt.</span>
            </>
          )}
          <span />
        </div>
        <div className="divide-y divide-border/70">
          {exercise.sets.map((set, setIndex) => (
            <div key={set.id} className="grid gap-1.5 px-2 py-1.5 sm:px-3">
              <div
                className={cn(
                  "grid items-center gap-1",
                  unilateral
                    ? "grid-cols-[2rem_minmax(0,1fr)_2.25rem]"
                    : "grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem]",
                )}
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
                {unilateral ? (
                  exercise.sets.length > 1 ? (
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
                  )
                ) : (
                  <>
                    <StepperField
                      label={`Powtórzenia, seria ${setIndex + 1}`}
                      value={set.reps}
                      step={1}
                      suffix=""
                      placeholder={
                        lastHint?.reps != null ? String(lastHint.reps) : String(exercise.repsMin)
                      }
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
                  </>
                )}
              </div>
              {unilateral ? (
                <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-1">
                  <span />
                  <StepperField
                    label={`Powtórzenia lewa, seria ${setIndex + 1}`}
                    value={set.repsLeft}
                    step={1}
                    suffix="L"
                    placeholder={
                      lastHint?.repsLeft != null
                        ? String(lastHint.repsLeft)
                        : String(exercise.repsMin)
                    }
                    onChange={(repsLeft) =>
                      onChangeSet(set.id, {
                        repsLeft: repsLeft === null ? null : Math.round(repsLeft),
                      })
                    }
                  />
                  <StepperField
                    label={`Powtórzenia prawa, seria ${setIndex + 1}`}
                    value={set.repsRight}
                    step={1}
                    suffix="P"
                    placeholder={
                      lastHint?.repsRight != null
                        ? String(lastHint.repsRight)
                        : String(exercise.repsMin)
                    }
                    onChange={(repsRight) =>
                      onChangeSet(set.id, {
                        repsRight: repsRight === null ? null : Math.round(repsRight),
                      })
                    }
                  />
                  <span />
                </div>
              ) : null}
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
