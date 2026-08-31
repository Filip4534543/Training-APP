import type { DayPlan, DayTone, ExerciseTemplate, WorkoutExercise } from "./types";

export const DAY_TONES: Record<
  DayTone,
  { bar: string; soft: string; text: string; chip: string }
> = {
  rose: {
    bar: "bg-rose-500",
    soft: "bg-rose-500/12",
    text: "text-rose-700 dark:text-rose-300",
    chip: "bg-rose-500/15 text-rose-800 dark:text-rose-200",
  },
  sky: {
    bar: "bg-sky-500",
    soft: "bg-sky-500/12",
    text: "text-sky-700 dark:text-sky-300",
    chip: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  },
  emerald: {
    bar: "bg-emerald-500",
    soft: "bg-emerald-500/12",
    text: "text-emerald-700 dark:text-emerald-300",
    chip: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  },
  amber: {
    bar: "bg-amber-500",
    soft: "bg-amber-500/12",
    text: "text-amber-800 dark:text-amber-300",
    chip: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  },
};

export function formatSetsScheme(
  exercise: Pick<
    ExerciseTemplate | WorkoutExercise,
    "setsMin" | "setsMax" | "repsMin" | "repsMax" | "note"
  >,
) {
  const sets =
    exercise.setsMin === exercise.setsMax
      ? `${exercise.setsMin}`
      : `${exercise.setsMin}–${exercise.setsMax}`;
  const reps =
    exercise.repsMin === exercise.repsMax
      ? `${exercise.repsMin}`
      : `${exercise.repsMin}–${exercise.repsMax}`;
  return exercise.note ? `${sets} × ${reps} ${exercise.note}` : `${sets} × ${reps}`;
}

export function formatKg(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(/\.0$/, "");
}

export function formatVolume(volume: number) {
  if (volume >= 1000) {
    const k = volume / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1).replace(".", ",")}k kg`;
  }
  return `${Math.round(volume)} kg`;
}

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    ...options,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatWeekday(iso = new Date().toISOString()) {
  return new Intl.DateTimeFormat("pl-PL", { weekday: "long" }).format(new Date(iso));
}

export function dayLabel(day: DayPlan) {
  return `${day.name} · ${day.focus}`;
}

export function exerciseKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function signed(value: number, suffix = "") {
  const abs = Math.abs(value);
  const formatted = Number.isInteger(abs) ? String(abs) : abs.toFixed(1).replace(/\.0$/, "");
  if (value > 0) return `+${formatted}${suffix}`;
  if (value < 0) return `−${formatted}${suffix}`;
  return `0${suffix}`;
}
