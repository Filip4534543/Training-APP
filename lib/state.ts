import { createDefaultState, getDay, isUnilateral } from "./plan";
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

function emptySet(): SetEntry {
  return {
    id: uid(),
    weight: null,
    reps: null,
    repsLeft: null,
    repsRight: null,
  };
}

function emptySets(count: number): SetEntry[] {
  return Array.from({ length: Math.max(1, count) }, () => emptySet());
}

function toWorkoutExercise(template: ExerciseTemplate): WorkoutExercise {
  return {
    slotId: template.id,
    name: template.name,
    setsMin: template.setsMin,
    setsMax: template.setsMax,
    repsMin: template.repsMin,
    repsMax: template.repsMax,
    unilateral: template.unilateral,
    note: template.note,
    since: template.since,
    sets: emptySets(template.setsMin),
  };
}

function normalizeSet(set: Partial<SetEntry>): SetEntry {
  return {
    id: typeof set.id === "string" && set.id ? set.id : uid(),
    weight: set.weight ?? null,
    reps: set.reps ?? null,
    repsLeft: set.repsLeft ?? null,
    repsRight: set.repsRight ?? null,
  };
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AppState;
  return (
    candidate.version === 2 &&
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
      exercises: day.exercises.map((exercise) => {
        const savedExercise = saved.exercises.find((item) => item.id === exercise.id);
        if (!savedExercise) return exercise;
        const name = savedExercise.name?.trim() || exercise.name;
        return {
          ...exercise,
          name,
          since: savedExercise.since,
          unilateral: savedExercise.unilateral ?? isUnilateral({ ...exercise, name }),
        };
      }),
    };
  });

  return {
    version: 2,
    plan,
    workouts: (raw.workouts ?? [])
      .filter((workout) => workout.dayId === 1 || workout.dayId === 2)
      .map((workout) => ({
        ...workout,
        exercises: workout.exercises.map((exercise) => ({
          ...exercise,
          unilateral: exercise.unilateral ?? isUnilateral(exercise),
          sets: (exercise.sets ?? []).map(normalizeSet),
        })),
      })),
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
    startedAt: new Date().toISOString(),
    completedAt: null,
    dayId,
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
  patch: Partial<Pick<SetEntry, "weight" | "reps" | "repsLeft" | "repsRight">>,
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
          repsLeft: last?.repsLeft ?? null,
          repsRight: last?.repsRight ?? null,
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

function applyExerciseChange(
  state: AppState,
  dayId: DayId,
  slotId: string,
  name: string,
  unilateral: boolean,
): AppState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  const since = new Date().toISOString();

  const plan = state.plan.map((day) => {
    if (day.id !== dayId) return day;
    return {
      ...day,
      exercises: day.exercises.map((exercise) =>
        exercise.id === slotId ? { ...exercise, name: trimmed, since, unilateral } : exercise,
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
              unilateral,
              sets: exercise.sets.map((set) => ({
                ...set,
                weight: null,
                reps: null,
                repsLeft: null,
                repsRight: null,
              })),
            }
          : exercise,
      ),
    };
  });

  return { ...state, plan, workouts };
}

export function changeExercise(
  state: AppState,
  dayId: DayId,
  slotId: string,
  name: string,
): AppState {
  return applyExerciseChange(state, dayId, slotId, name, isUnilateral({ name }));
}

export function restoreDefaultExercise(state: AppState, dayId: DayId, slotId: string): AppState {
  const defaults = createDefaultState();
  const original = getDay(defaults.plan, dayId)?.exercises.find((exercise) => exercise.id === slotId);
  if (!original) return state;
  return applyExerciseChange(
    state,
    dayId,
    slotId,
    original.name,
    original.unilateral ?? false,
  );
}

export function getWorkout(state: AppState, workoutId: string | null) {
  if (!workoutId) return null;
  return state.workouts.find((workout) => workout.id === workoutId) ?? null;
}
