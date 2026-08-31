import { createDefaultState, getDay } from "./plan";
import type {
  AppState,
  DayId,
  ExerciseTemplate,
  SetEntry,
  Workout,
  WorkoutExercise,
} from "./types";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function emptySets(count: number): SetEntry[] {
  return Array.from({ length: Math.max(1, count) }, () => ({
    id: uid(),
    weight: null,
    reps: null,
  }));
}

function toWorkoutExercise(template: ExerciseTemplate): WorkoutExercise {
  return {
    slotId: template.id,
    name: template.name,
    setsMin: template.setsMin,
    setsMax: template.setsMax,
    repsMin: template.repsMin,
    repsMax: template.repsMax,
    note: template.note,
    since: template.since,
    sets: emptySets(template.setsMin),
  };
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AppState;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.plan) &&
    Array.isArray(candidate.workouts)
  );
}

export function mergeWithDefaults(raw: unknown): AppState {
  if (!isAppState(raw)) return createDefaultState();
  const defaults = createDefaultState();
  const plan = defaults.plan.map((day) => {
    const saved = raw.plan.find((item) => item.id === day.id);
    if (!saved) return day;
    return {
      ...day,
      ...saved,
      id: day.id,
      tone: day.tone,
      exercises:
        saved.exercises?.length > 0
          ? saved.exercises.map((exercise) => ({
              ...exercise,
              name: exercise.name?.trim() || "Ćwiczenie",
              setsMin: Math.max(1, exercise.setsMin || 1),
              setsMax: Math.max(exercise.setsMin || 1, exercise.setsMax || exercise.setsMin || 1),
            }))
          : day.exercises,
    };
  });
  return {
    version: 1,
    plan,
    workouts: raw.workouts ?? [],
    activeWorkoutId: raw.activeWorkoutId ?? null,
  };
}

export function startWorkout(state: AppState, dayId: DayId): AppState {
  const existing = state.workouts.find((workout) => workout.id === state.activeWorkoutId);
  if (existing && existing.dayId === dayId && !existing.completedAt) {
    return state;
  }

  const day = getDay(state.plan, dayId);
  if (!day) return state;

  const workout: Workout = {
    id: uid(),
    dayId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    exercises: day.exercises.map(toWorkoutExercise),
  };

  return {
    ...state,
    activeWorkoutId: workout.id,
    workouts: [workout, ...state.workouts.filter((item) => item.completedAt)],
  };
}

export function discardActiveWorkout(state: AppState): AppState {
  if (!state.activeWorkoutId) return state;
  return {
    ...state,
    activeWorkoutId: null,
    workouts: state.workouts.filter(
      (workout) => workout.id !== state.activeWorkoutId || workout.completedAt,
    ),
  };
}

function patchWorkout(
  state: AppState,
  workoutId: string,
  updater: (workout: Workout) => Workout,
): AppState {
  return {
    ...state,
    workouts: state.workouts.map((workout) =>
      workout.id === workoutId ? updater(workout) : workout,
    ),
  };
}

function patchExercise(
  state: AppState,
  workoutId: string,
  slotId: string,
  updater: (exercise: WorkoutExercise) => WorkoutExercise,
): AppState {
  return patchWorkout(state, workoutId, (workout) => ({
    ...workout,
    exercises: workout.exercises.map((exercise) =>
      exercise.slotId === slotId ? updater(exercise) : exercise,
    ),
  }));
}

export function updateSet(
  state: AppState,
  workoutId: string,
  slotId: string,
  setId: string,
  patch: Partial<Pick<SetEntry, "weight" | "reps">>,
): AppState {
  return patchExercise(state, workoutId, slotId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
  }));
}

export function addSet(state: AppState, workoutId: string, slotId: string): AppState {
  return patchExercise(state, workoutId, slotId, (exercise) => {
    const last = exercise.sets[exercise.sets.length - 1];
    return {
      ...exercise,
      sets: [
        ...exercise.sets,
        {
          id: uid(),
          weight: last?.weight ?? null,
          reps: last?.reps ?? null,
        },
      ],
    };
  });
}

export function removeSet(
  state: AppState,
  workoutId: string,
  slotId: string,
  setId: string,
): AppState {
  return patchExercise(state, workoutId, slotId, (exercise) => {
    if (exercise.sets.length <= 1) return exercise;
    return { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) };
  });
}

export function completeWorkout(state: AppState, workoutId: string): AppState {
  return {
    ...state,
    activeWorkoutId: state.activeWorkoutId === workoutId ? null : state.activeWorkoutId,
    workouts: state.workouts.map((workout) =>
      workout.id === workoutId
        ? { ...workout, completedAt: new Date().toISOString() }
        : workout,
    ),
  };
}

export function changeExercise(
  state: AppState,
  dayId: DayId,
  slotId: string,
  name: string,
): AppState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  const since = new Date().toISOString();

  const plan = state.plan.map((day) => {
    if (day.id !== dayId) return day;
    return {
      ...day,
      exercises: day.exercises.map((exercise) =>
        exercise.id === slotId ? { ...exercise, name: trimmed, since } : exercise,
      ),
    };
  });

  const workouts = state.workouts.map((workout) => {
    if (workout.completedAt) return workout;
    if (workout.dayId !== dayId) return workout;
    return {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.slotId === slotId
          ? {
              ...exercise,
              name: trimmed,
              since,
              sets: exercise.sets.map((set) => ({ ...set, weight: null, reps: null })),
            }
          : exercise,
      ),
    };
  });

  return { ...state, plan, workouts };
}

export function restoreDefaultExercise(state: AppState, dayId: DayId, slotId: string): AppState {
  const defaults = createDefaultState();
  const original = getDay(defaults.plan, dayId)?.exercises.find((exercise) => exercise.id === slotId);
  if (!original) return state;
  return changeExercise(state, dayId, slotId, original.name);
}

export function getWorkout(state: AppState, workoutId: string | null) {
  if (!workoutId) return null;
  return state.workouts.find((workout) => workout.id === workoutId) ?? null;
}
