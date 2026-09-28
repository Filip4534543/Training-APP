"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepperField } from "@/components/stepper-field";
import { formatKg, formatSetsScheme } from "@/lib/format";
import { exerciseKind, isBodyweight, isUnilateral } from "@/lib/plan";
import { filledSets, previousSetForIndex } from "@/lib/progress";
import type { WorkoutExercise } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  exercise: WorkoutExercise;
  previousExercise?: WorkoutExercise | null;
  bodyWeightKg?: number | null;
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

function lastHintLabel(previous: WorkoutExercise, unilateral: boolean) {
  const last = previousSetForIndex(previous, 0);
  if (!last) return null;
  if (unilateral) {
    return `Ostatnio 1. seria: ${formatKg(last.weight)} kg × L ${last.repsLeft ?? "—"} / P ${last.repsRight ?? "—"}`;
  }
  return `Ostatnio 1. seria: ${formatKg(last.weight)} kg × ${last.reps ?? "—"}`;
}

export function ExerciseBlock({
  index,
  exercise,
  previousExercise,
  bodyWeightKg,
  onChangeSet,
  onAddSet,
  onRemoveSet,
  onRename,
}: Props) {
  const kind = exerciseKind(exercise);
  const unilateral = isUnilateral(exercise);
  const logged = filledSets(exercise.sets, unilateral).length;
  const headerHint = previousExercise ? lastHintLabel(previousExercise, unilateral) : null;
  const massHint = isBodyweight(exercise)
    ? bodyWeightKg != null
      ? `Masa ciała: ${formatKg(bodyWeightKg)} kg`
      : "Brak wagi ciała — zapisz ją w zakładce Waga."
    : null;

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
          {headerHint ? (
            <p className="mt-1 text-xs text-muted-foreground">{headerHint}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Brak historii — od tej sesji.</p>
          )}
          {massHint ? <p className="mt-0.5 text-xs text-muted-foreground">{massHint}</p> : null}
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
            <span className="text-center">{kind === "bodyweight" ? "Masa ciała" : "Ciężar"}</span>
              <span className="text-center">Powt.</span>
            </>
          )}
          <span />
        </div>
        <div className="divide-y divide-border/70">
          {exercise.sets.map((set, setIndex) => {
            const last = previousSetForIndex(previousExercise ?? null, setIndex);
            const fallbackWeight =
              last?.weight ?? (kind === "bodyweight" ? (bodyWeightKg ?? null) : null);
            return (
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
                    placeholder={fallbackWeight != null ? formatKg(fallbackWeight) : "0"}
                    lastValue={
                      last?.weight != null
                        ? `${formatKg(last.weight)} kg`
                        : kind === "bodyweight" && bodyWeightKg != null
                          ? `${formatKg(bodyWeightKg)} kg`
                          : null
                    }
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
                          last?.reps != null ? String(last.reps) : String(exercise.repsMin)
                        }
                        lastValue={last?.reps != null ? String(last.reps) : null}
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
                        last?.repsLeft != null ? String(last.repsLeft) : String(exercise.repsMin)
                      }
                      lastValue={last?.repsLeft != null ? String(last.repsLeft) : null}
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
                        last?.repsRight != null
                          ? String(last.repsRight)
                          : String(exercise.repsMin)
                      }
                      lastValue={last?.repsRight != null ? String(last.repsRight) : null}
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
            );
          })}
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
