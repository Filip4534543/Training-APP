import type { AppState, DayId, DayPlan, Profile, ProfileId } from "./types";

function exercise(
  id: string,
  name: string,
  sets: number,
  repsMin: number,
  repsMax: number,
  extra?: { unilateral?: boolean; note?: string },
) {
  return { id, name, setsMin: sets, setsMax: sets, repsMin, repsMax, ...extra };
}

export const FILIP_PLAN: DayPlan[] = [
  {
    id: 1,
    name: "Dzień 1",
    focus: "Plan A",
    tone: "rose",
    exercises: [
      exercise("d1-bench", "Wyciskanie na klatę", 4, 6, 10),
      exercise("d1-pullup", "Podciąganie z ciężarem", 4, 5, 10),
      exercise("d1-decline-pushup", "Pompki z nogami na podwyższeniu", 3, 8, 15),
      exercise("d1-cable-row", "Wiosłowanie na wyciągu", 3, 8, 12),
      exercise("d1-kb-squat", "Przysiady z kettlem", 3, 8, 12),
      exercise("d1-cable-curl", "Biceps na wyciągu (jednorącz)", 3, 10, 15, { unilateral: true }),
      exercise("d1-triceps", "Triceps na wyciągu", 3, 10, 15),
      exercise("d1-crunch", "Brzuszki", 3, 10, 15),
    ],
  },
  {
    id: 2,
    name: "Dzień 2",
    focus: "Plan B",
    tone: "sky",
    exercises: [
      exercise("d2-ohp", "OHP", 4, 6, 10),
      exercise("d2-pullup", "Podciąganie z ciężarem", 4, 5, 10),
      exercise("d2-bench", "Wyciskanie na klatę", 3, 6, 10),
      exercise("d2-single-row", "Wiosłowanie na wyciągu jednorącz", 3, 8, 12, { unilateral: true }),
      exercise("d2-lateral-raise", "Wznosy bokiem na wyciągu jednorącz", 3, 10, 15, {
        unilateral: true,
      }),
      exercise("d2-cable-leg-raise", "Unoszenie nóg na wyciągu", 3, 10, 15),
    ],
  },
];

export const PATRYCJA_PLAN: DayPlan[] = [
  {
    id: 1,
    name: "Dół",
    focus: "Nogi i pośladki",
    tone: "emerald",
    exercises: [
      exercise("p1-hip-abductor", "Hip abductor", 3, 10, 15),
      exercise("p1-adductor", "Adductor", 3, 10, 15),
      exercise("p1-leg-press", "Suwnica", 4, 8, 12),
      exercise("p1-hip-thrust", "Hip thrust", 4, 8, 12),
      exercise("p1-rdl", "RDL", 4, 8, 12),
      exercise("p1-sumo-squat", "Przysiady sumo z ciężarem", 4, 8, 12),
      exercise("p1-roman-chair", "Rzymska ławeczka", 3, 10, 15),
      exercise("p1-straight-abduction", "Odwodzenie nóg prosto", 3, 10, 15),
      exercise("p1-supported-leg-raise", "Podciąganie nóg w oparciu", 3, 10, 15),
      exercise("p1-transverse", "Poprzecznie", 3, 10, 15),
    ],
  },
  {
    id: 2,
    name: "Góra",
    focus: "Plecy, ramiona i klatka",
    tone: "amber",
    exercises: [
      exercise("p2-row", "Wiosłowanie", 4, 8, 12),
      exercise("p2-back-extension", "Odchylanie pleców do tyłu", 3, 10, 15),
      exercise("p2-leg-raise", "Podciąganie nóg", 3, 10, 15),
      exercise("p2-supported-pullup", "Podciąganie się w oparciu o ramiona", 4, 6, 12),
      exercise("p2-roman", "Rzymska", 3, 10, 15),
      exercise("p2-biceps", "Biceps", 3, 10, 15),
      exercise("p2-triceps", "Triceps", 3, 10, 15),
      exercise("p2-chest-fly", "Odwodzenie klatki", 3, 10, 15),
      exercise("p2-db-press", "Wyciskanie ciężarkami", 4, 8, 12),
    ],
  },
];

export const DEFAULT_PLAN = FILIP_PLAN;

export const PROFILE_SEEDS: Pick<Profile, "id" | "name" | "plan">[] = [
  { id: "filip", name: "Filip", plan: FILIP_PLAN },
  { id: "patrycja", name: "Patrycja", plan: PATRYCJA_PLAN },
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
  "RDL",
  "Przysiady sumo z ciężarem",
  "Hip abductor",
  "Adductor",
  "Suwnica",
];

export function emptyProfile(seed: Pick<Profile, "id" | "name" | "plan">): Profile {
  return {
    id: seed.id,
    name: seed.name,
    plan: structuredClone(seed.plan),
    workouts: [],
    activeWorkoutId: null,
    bodyWeights: [],
  };
}

export function createDefaultState(): AppState {
  return {
    version: 3,
    activeProfileId: "filip",
    profiles: PROFILE_SEEDS.map(emptyProfile),
  };
}

export function defaultPlanFor(profileId: ProfileId) {
  return PROFILE_SEEDS.find((item) => item.id === profileId)?.plan ?? FILIP_PLAN;
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

export function isProfileId(value: unknown): value is ProfileId {
  return value === "filip" || value === "patrycja";
}
