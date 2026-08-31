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
import { EXTRA_EXERCISE_SUGGESTIONS } from "@/lib/plan";
import type { DayPlan, ExerciseTemplate } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: DayPlan;
  exercise: ExerciseTemplate;
  catalog: string[];
  onConfirm: (name: string) => void;
  onRestore: () => void;
};

export function ChangeExerciseDialog({
  open,
  onOpenChange,
  day,
  exercise,
  catalog,
  onConfirm,
  onRestore,
}: Props) {
  const [name, setName] = useState(exercise.name);

  const suggestions = useMemo(() => {
    const query = name.trim().toLowerCase();
    const pool = [...new Set([...catalog, ...EXTRA_EXERCISE_SUGGESTIONS])].filter(
      (item) => item !== exercise.name,
    );
    if (!query) return pool.slice(0, 8);
    return pool.filter((item) => item.toLowerCase().includes(query)).slice(0, 8);
  }, [catalog, exercise.name, name]);

  function submit(nextName: string) {
    const trimmed = nextName.trim();
    if (!trimmed) {
      toast.error("Podaj nazwę ćwiczenia.");
      return;
    }
    if (trimmed === exercise.name) {
      onOpenChange(false);
      return;
    }
    onConfirm(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setName(exercise.name);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zmień ćwiczenie</DialogTitle>
          <DialogDescription>
            {day.name}: {exercise.name}. Po zmianie statystyki tego slotu liczą
            się od zera — stary progres zostaje w historii pod poprzednią nazwą.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(name);
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
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onRestore();
                onOpenChange(false);
              }}
            >
              Przywróć z planu
            </Button>
            <Button type="submit">Zapisz i zeruj statystyki</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
