"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { ChangeExerciseDialog } from "@/components/change-exercise-dialog";
import { PatternPad } from "@/components/pattern-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DAY_TONES, formatDate, formatSetsScheme } from "@/lib/format";
import { hashPattern, MIN_PATTERN_LENGTH } from "@/lib/pattern";
import { exerciseKind, kindLabel } from "@/lib/plan";
import { lastLoggedExercise } from "@/lib/progress";
import type { DayPlan, ExerciseTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

type Editor =
  | { type: "exercise"; day: DayPlan; exercise: ExerciseTemplate }
  | { type: "create"; day: DayPlan }
  | null;

export function ExercisesScreen() {
  const {
    profile,
    updateExerciseDetails,
    resetExercise,
    addDay,
    addExercise,
    removeExercise,
    removeDay,
    savePattern,
    status,
  } = useAppState();
  const [editing, setEditing] = useState<Editor>(null);
  const [addingDay, setAddingDay] = useState(false);
  const [dayName, setDayName] = useState("");
  const [dayFocus, setDayFocus] = useState("");
  const [patternOpen, setPatternOpen] = useState(false);
  const [patternDraft, setPatternDraft] = useState<number[] | null>(null);
  const [patternError, setPatternError] = useState<string | null>(null);

  const catalog = useMemo(
    () => profile.plan.flatMap((day) => day.exercises.map((exercise) => exercise.name)),
    [profile.plan],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
            {profile.name}
          </p>
          <h1 className="font-heading text-3xl tracking-wide uppercase sm:text-4xl">Ćwiczenia</h1>
        </div>
        <Button type="button" variant="outline" className="h-10 shrink-0" onClick={() => setPatternOpen(true)}>
          Wzór
        </Button>
      </header>

      {status === "loading" ? (
        <p className="text-sm text-muted-foreground">Wczytuję plan…</p>
      ) : (
        <div className="grid gap-4">
          {profile.plan.map((day) => {
            const tone = DAY_TONES[day.tone];
            return (
              <section key={day.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
                <div className={cn("h-1.5", tone.bar)} />
                <div className="flex items-start justify-between gap-3 px-4 pt-4">
                  <div>
                    <p className={cn("text-[11px] font-medium tracking-widest uppercase", tone.text)}>
                      {day.name}
                    </p>
                    <h2 className="font-heading text-2xl tracking-wide uppercase">{day.focus}</h2>
                  </div>
                  {profile.plan.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10 text-destructive"
                      aria-label="Usuń dzień"
                      onClick={() => {
                        if (window.confirm(`Usunąć ${day.name} z planu?`)) removeDay(day.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <ul className="divide-y divide-border/70 pt-2">
                  {day.exercises.map((exercise) => {
                    const last = lastLoggedExercise(profile.workouts, exercise.name, exercise.since);
                    return (
                      <li key={exercise.id} className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{exercise.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {kindLabel(exerciseKind(exercise))} · {formatSetsScheme(exercise)}
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
                          className="h-10 shrink-0 px-3"
                          onClick={() => setEditing({ type: "exercise", day, exercise })}
                        >
                          Edytuj
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <div className="px-3 py-3 sm:px-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full"
                    onClick={() => setEditing({ type: "create", day })}
                  >
                    <Plus data-icon="inline-start" />
                    Dodaj ćwiczenie
                  </Button>
                </div>
              </section>
            );
          })}

          <Button type="button" className="h-12" onClick={() => setAddingDay(true)}>
            <Plus data-icon="inline-start" />
            Dodaj dzień
          </Button>
        </div>
      )}

      {editing ? (
        <ChangeExerciseDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          day={editing.day}
          exercise={editing.type === "exercise" ? editing.exercise : null}
          catalog={catalog}
          onConfirm={(patch) => {
            if (editing.type === "create") {
              addExercise(editing.day.id, patch);
            } else {
              updateExerciseDetails(editing.day.id, editing.exercise.id, patch);
            }
          }}
          onRestore={
            editing.type === "exercise"
              ? () => resetExercise(editing.day.id, editing.exercise.id)
              : undefined
          }
          onDelete={
            editing.type === "exercise"
              ? () => removeExercise(editing.day.id, editing.exercise.id)
              : undefined
          }
        />
      ) : null}

      <Dialog open={addingDay} onOpenChange={setAddingDay}>
        <DialogContent className="top-auto bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-4">
          <DialogHeader>
            <DialogTitle>Nowy dzień</DialogTitle>
            <DialogDescription>Dodaj kolejny dzień do planu {profile.name}.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!dayName.trim()) return;
              addDay(dayName, dayFocus);
              setDayName("");
              setDayFocus("");
              setAddingDay(false);
            }}
          >
            <Input
              value={dayName}
              onChange={(event) => setDayName(event.target.value)}
              placeholder="Nazwa, np. Dzień 3"
              className="h-11"
            />
            <Input
              value={dayFocus}
              onChange={(event) => setDayFocus(event.target.value)}
              placeholder="Focus, np. Nogi"
              className="h-11"
            />
            <DialogFooter>
              <Button type="submit" className="h-11 w-full" disabled={!dayName.trim()}>
                Dodaj dzień
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={patternOpen}
        onOpenChange={(open) => {
          setPatternOpen(open);
          setPatternDraft(null);
          setPatternError(null);
        }}
      >
        <DialogContent className="top-auto bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-4">
          <DialogHeader>
            <DialogTitle>{patternDraft ? "Powtórz wzór" : "Ustaw wzór"}</DialogTitle>
            <DialogDescription>
              Wzór 9 kropek dla profilu {profile.name}. Minimum 4 punkty.
            </DialogDescription>
          </DialogHeader>
          <PatternPad
            error={Boolean(patternError)}
            onComplete={(path) => {
              if (path.length < MIN_PATTERN_LENGTH) {
                setPatternError("Minimum 4 kropki.");
                return;
              }
              if (!patternDraft) {
                setPatternDraft(path);
                setPatternError(null);
                return;
              }
              if (path.join("-") !== patternDraft.join("-")) {
                setPatternError("Wzory się nie zgadzają.");
                setPatternDraft(null);
                return;
              }
              void hashPattern(path).then((hash) => {
                savePattern(profile.id, hash);
                setPatternOpen(false);
                setPatternDraft(null);
              });
            }}
          />
          {patternError ? <p className="text-center text-sm text-destructive">{patternError}</p> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
