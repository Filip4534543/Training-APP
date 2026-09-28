"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EXTRA_EXERCISE_SUGGESTIONS, exerciseKind, kindLabel } from "@/lib/plan";
import type { DayPlan, ExerciseKind, ExercisePatch, ExerciseTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

const KINDS: ExerciseKind[] = ["normal", "unilateral", "bodyweight"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: DayPlan;
  exercise?: ExerciseTemplate | null;
  catalog: string[];
  onConfirm: (patch: ExercisePatch & { name: string; kind: ExerciseKind }) => void;
  onRestore?: () => void;
  onDelete?: () => void;
};

export function ChangeExerciseDialog({
  open,
  onOpenChange,
  day,
  exercise,
  catalog,
  onConfirm,
  onRestore,
  onDelete,
}: Props) {
  const creating = !exercise;
  const [name, setName] = useState(exercise?.name ?? "");
  const [kind, setKind] = useState<ExerciseKind>(exercise ? exerciseKind(exercise) : "normal");
  const [sets, setSets] = useState(String(exercise?.setsMin ?? 3));
  const [repsMin, setRepsMin] = useState(String(exercise?.repsMin ?? 8));
  const [repsMax, setRepsMax] = useState(String(exercise?.repsMax ?? 12));

  const suggestions = useMemo(() => {
    const query = name.trim().toLowerCase();
    const pool = [...new Set([...catalog, ...EXTRA_EXERCISE_SUGGESTIONS])].filter(
      (item) => item !== exercise?.name,
    );
    if (!query) return pool.slice(0, 8);
    return pool.filter((item) => item.toLowerCase().includes(query)).slice(0, 8);
  }, [catalog, exercise?.name, name]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Podaj nazwę ćwiczenia.");
      return;
    }
    const setsMin = Math.max(1, Number(sets) || 3);
    const minReps = Math.max(1, Number(repsMin) || 8);
    const maxReps = Math.max(minReps, Number(repsMax) || minReps);
    onConfirm({
      name: trimmed,
      kind,
      setsMin,
      setsMax: setsMin,
      repsMin: minReps,
      repsMax: maxReps,
    });
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setName(exercise?.name ?? "");
          setKind(exercise ? exerciseKind(exercise) : "normal");
          setSets(String(exercise?.setsMin ?? 3));
          setRepsMin(String(exercise?.repsMin ?? 8));
          setRepsMax(String(exercise?.repsMax ?? 12));
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="top-auto bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-4">
        <DialogHeader>
          <DialogTitle>{creating ? "Dodaj ćwiczenie" : "Edytuj ćwiczenie"}</DialogTitle>
          <DialogDescription>
            {day.name}
            {exercise ? `: ${exercise.name}. Zmiana nazwy albo typu zeruje statystyki tego slota.` : ". Nowe ćwiczenie trafi do tego dnia."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            placeholder="Nazwa ćwiczenia"
            autoFocus
            className="h-11 text-base"
          />
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setName(item)}
                  className="rounded-full bg-muted px-2.5 py-1 text-left text-xs text-muted-foreground hover:bg-foreground hover:text-background"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Typ
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {KINDS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setKind(item)}
                  className={cn(
                    "rounded-xl px-2 py-2 text-center text-xs font-medium ring-1",
                    kind === item
                      ? "bg-foreground text-background ring-foreground"
                      : "bg-muted/60 text-muted-foreground ring-transparent",
                  )}
                >
                  {kindLabel(item)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {kind === "unilateral"
                ? "Powtórzenia osobno na lewą i prawą stronę."
                : kind === "bodyweight"
                  ? "Ciężar startuje od ostatniej wagi ciała."
                  : "Zwykły ciężar i powtórzenia."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="grid gap-1">
              <span className="text-[11px] text-muted-foreground">Serie</span>
              <Input inputMode="numeric" value={sets} onChange={(event) => setSets(event.target.value)} className="h-10" />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] text-muted-foreground">Powt. od</span>
              <Input inputMode="numeric" value={repsMin} onChange={(event) => setRepsMin(event.target.value)} className="h-10" />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] text-muted-foreground">Powt. do</span>
              <Input inputMode="numeric" value={repsMax} onChange={(event) => setRepsMax(event.target.value)} className="h-10" />
            </label>
          </div>

          <DialogFooter className="max-sm:flex-col-reverse sm:justify-between">
            {creating ? (
              <Button type="button" variant="ghost" className="h-11 w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                Anuluj
              </Button>
            ) : (
              <div className="flex w-full flex-col gap-2 sm:w-auto">
                {onRestore ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full sm:w-auto"
                    onClick={() => {
                      onRestore();
                      onOpenChange(false);
                    }}
                  >
                    Przywróć z planu
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full text-destructive sm:w-auto"
                    onClick={() => {
                      if (window.confirm("Usunąć to ćwiczenie z planu?")) {
                        onDelete();
                        onOpenChange(false);
                      }
                    }}
                  >
                    Usuń
                  </Button>
                ) : null}
              </div>
            )}
            <Button type="submit" className="h-11 w-full sm:w-auto">
              {creating ? "Dodaj" : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
