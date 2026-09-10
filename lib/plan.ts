import type { AppState, DayId, DayPlan } from "./types";

export const DEFAULT_PLAN: DayPlan[] = [
  {
    id: 1,
    name: "Dzień 1",
    focus: "Plan A",
    tone: "rose",
    exercises: [
      {
        id: "d1-bench",
        name: "Wyciskanie na klatę",
        setsMin: 4,
        setsMax: 4,
        repsMin: 6,
        repsMax: 10,
      },
      {
        id: "d1-pullup",
        name: "Podciąganie z ciężarem",
        setsMin: 4,
        setsMax: 4,
        repsMin: 5,
        repsMax: 10,
      },
      {
        id: "d1-decline-pushup",
        name: "Pompki z nogami na podwyższeniu",
        setsMin: 3,
        setsMax: 3,
        repsMin: 8,
        repsMax: 15,
      },
      {
        id: "d1-cable-row",
        name: "Wiosłowanie na wyciągu",
        setsMin: 3,
        setsMax: 3,
        repsMin: 8,
        repsMax: 12,
      },
      {
        id: "d1-kb-squat",
        name: "Przysiady z kettlem",
        setsMin: 3,
        setsMax: 3,
        repsMin: 8,
        repsMax: 12,
      },
      {
        id: "d1-cable-curl",
        name: "Biceps na wyciągu (jednorącz)",
        setsMin: 3,
        setsMax: 3,
        repsMin: 10,
        repsMax: 15,
        unilateral: true,
      },
      {
        id: "d1-triceps",
        name: "Triceps na wyciągu",
        setsMin: 3,
        setsMax: 3,
        repsMin: 10,
        repsMax: 15,
      },
      {
        id: "d1-crunch",
        name: "Brzuszki",
        setsMin: 3,
        setsMax: 3,
        repsMin: 10,
        repsMax: 15,
      },
    ],
  },
  {
    id: 2,
    name: "Dzień 2",
    focus: "Plan B",
    tone: "sky",
    exercises: [
      {
        id: "d2-ohp",
        name: "OHP",
        setsMin: 4,
        setsMax: 4,
        repsMin: 6,
        repsMax: 10,
      },
      {
        id: "d2-pullup",
        name: "Podciąganie z ciężarem",
        setsMin: 4,
        setsMax: 4,
        repsMin: 5,
        repsMax: 10,
      },
      {
        id: "d2-bench",
        name: "Wyciskanie na klatę",
        setsMin: 3,
        setsMax: 3,
        repsMin: 6,
        repsMax: 10,
      },
      {
        id: "d2-single-row",
        name: "Wiosłowanie na wyciągu jednorącz",
        setsMin: 3,
        setsMax: 3,
        repsMin: 8,
        repsMax: 12,
        unilateral: true,
      },
      {
        id: "d2-lateral-raise",
        name: "Wznosy bokiem na wyciągu jednorącz",
        setsMin: 3,
        setsMax: 3,
        repsMin: 10,
        repsMax: 15,
        unilateral: true,
      },
      {
        id: "d2-cable-leg-raise",
        name: "Unoszenie nóg na wyciągu",
        setsMin: 3,
        setsMax: 3,
        repsMin: 10,
        repsMax: 15,
      },
    ],
  },
];

export const EXTRA_EXERCISE_SUGGESTIONS = [
  "Wyciskanie hantli na ławce płaskiej",
  "Wyciskanie na ławce skośnej",
  "Pompki klasyczne",
  "Dip na poręczach",
  "Wyciskanie żołnierskie",
  "Unoszenie hantli bokiem",
  "Martwy ciąg",
  "Ściąganie drążka wyciągu",
  "Hip thrust",
  "Plank",
];

export function createDefaultState(): AppState {
  return {
    version: 2,
    plan: structuredClone(DEFAULT_PLAN),
    workouts: [],
    activeWorkoutId: null,
  };
}

export function getDay(plan: DayPlan[], dayId: number) {
  return plan.find((day) => day.id === dayId) ?? null;
}

export function parseDayId(value: string): DayId | null {
  const day = Number(value);
  if (day === 1 || day === 2) return day;
  return null;
}

export function isUnilateral(exercise: { unilateral?: boolean; name?: string }) {
  if (exercise.unilateral) return true;
  return /jednor[aą]cz/i.test(exercise.name ?? "");
}
