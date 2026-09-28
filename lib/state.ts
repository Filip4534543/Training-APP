import {
  createDefaultState,
  defaultPlanFor,
  emptyProfile,
  getDay,
  isProfileId,
  isUnilateral,
  PROFILE_SEEDS,
} from "./plan";
import type {
  AppState,
  BodyWeightEntry,
  DayId,
  DayPlan,
  ExerciseTemplate,
  Profile,
  ProfileId,
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

function normalizeWorkout(workout: Workout): Workout {
  return {
    ...workout,
    exercises: (workout.exercises ?? []).map((exercise) => ({
      ...exercise,
      unilateral: exercise.unilateral ?? isUnilateral(exercise),
      sets: (exercise.sets ?? []).map(normalizeSet),
    })),
  };
}

function mergePlan(defaultPlan: DayPlan[], saved: DayPlan[] | undefined): DayPlan[] {
  return defaultPlan.map((day) => {
    const existing = saved?.find((item) => item.id === day.id);
    if (!existing) return day;
    return {
      ...day,
      name: existing.name?.trim() || day.name,
      focus: existing.focus?.trim() || day.focus,
      exercises: day.exercises.map((exercise) => {
        const savedExercise = existing.exercises.find((item) => item.id === exercise.id);
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
}

function normalizeBodyWeight(entry: Partial<BodyWeightEntry>): BodyWeightEntry | null {
  const weight = Number(entry.weight);
  if (!Number.isFinite(weight) || weight <= 0) return null;
  const recordedAt =
    typeof entry.recordedAt === "string" && entry.recordedAt
      ? entry.recordedAt
      : new Date().toISOString();
  return {
    id: typeof entry.id === "string" && entry.id ? entry.id : uid(),
    weight,
    recordedAt,
  };
}

function hydrateProfile(seed: (typeof PROFILE_SEEDS)[number], saved?: Partial<Profile>): Profile {
  return {
    id: seed.id,
    name: seed.name,
    plan: mergePlan(seed.plan, saved?.plan),
    workouts: (saved?.workouts ?? [])
      .filter((workout) => workout.dayId === 1 || workout.dayId === 2)
      .map(normalizeWorkout),
    activeWorkoutId: saved?.activeWorkoutId ?? null,
    bodyWeights: (saved?.bodyWeights ?? [])
      .map(normalizeBodyWeight)
      .filter((entry): entry is BodyWeightEntry => Boolean(entry))
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
  };
}

type LegacyState = {
  version: 2;
  plan: DayPlan[];
  workouts: Workout[];
  activeWorkoutId: string | null;
};

function isLegacyState(value: unknown): value is LegacyState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as LegacyState;
  return (
    candidate.version === 2 &&
    Array.isArray(candidate.plan) &&
    Array.isArray(candidate.workouts)
  );
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AppState;
  return (
    candidate.version === 3 &&
    isProfileId(candidate.activeProfileId) &&
    Array.isArray(candidate.profiles)
  );
}

export function activeProfile(state: AppState): Profile {
  return (
    state.profiles.find((profile) => profile.id === state.activeProfileId) ??
    state.profiles[0] ??
    emptyProfile(PROFILE_SEEDS[0])
  );
}

export function mergeWithDefaults(raw: unknown): AppState {
  if (isLegacyState(raw)) {
    return {
      version: 3,
      activeProfileId: "filip",
      profiles: PROFILE_SEEDS.map((seed) =>
        seed.id === "filip"
          ? hydrateProfile(seed, {
              plan: raw.plan,
              workouts: raw.workouts,
              activeWorkoutId: raw.activeWorkoutId ?? null,
            })
          : hydrateProfile(seed),
      ),
    };
  }

  if (!isAppState(raw) && !(raw && typeof raw === "object" && Array.isArray((raw as AppState).profiles))) {
    return createDefaultState();
  }

  const candidate = raw as Partial<AppState>;
  const savedProfiles = candidate.profiles ?? [];
  const profiles = PROFILE_SEEDS.map((seed) => {
    const saved = savedProfiles.find((item) => item?.id === seed.id);
    return hydrateProfile(seed, saved);
  });
  const activeProfileId: ProfileId = isProfileId(candidate.activeProfileId)
    ? candidate.activeProfileId
    : "filip";

  return { version: 3, activeProfileId, profiles };
}

export function setActiveProfile(state: AppState, profileId: ProfileId): AppState {
  if (state.activeProfileId === profileId) return state;
  if (!state.profiles.some((profile) => profile.id === profileId)) return state;
  return { ...state, activeProfileId: profileId };
}

function patchActiveProfile(state: AppState, updater: (profile: Profile) => Profile): AppState {
  const currentId = state.activeProfileId;
  return {
    ...state,
    profiles: state.profiles.map((profile) =>
      profile.id === currentId ? updater(profile) : profile,
    ),
  };
}

export function startWorkout(state: AppState, dayId: DayId): AppState {
  return patchActiveProfile(state, (profile) => {
    const existing = profile.workouts.find((workout) => workout.id === profile.activeWorkoutId);
    if (existing && existing.dayId === dayId && !existing.completedAt) {
      return profile;
    }

    const day = getDay(profile.plan, dayId);
    if (!day) return profile;

    const workout: Workout = {
      id: uid(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      dayId,
      exercises: day.exercises.map(toWorkoutExercise),
    };

    return {
      ...profile,
      activeWorkoutId: workout.id,
      workouts: [workout, ...profile.workouts.filter((item) => item.completedAt)],
    };
  });
}

export function discardActiveWorkout(state: AppState): AppState {
  return patchActiveProfile(state, (profile) => {
    if (!profile.activeWorkoutId) return profile;
    return {
      ...profile,
      activeWorkoutId: null,
      workouts: profile.workouts.filter(
        (workout) => workout.id !== profile.activeWorkoutId || workout.completedAt,
      ),
    };
  });
}

export function deleteWorkout(state: AppState, workoutId: string): AppState {
  return patchActiveProfile(state, (profile) => ({
    ...profile,
    activeWorkoutId: profile.activeWorkoutId === workoutId ? null : profile.activeWorkoutId,
    workouts: profile.workouts.filter((workout) => workout.id !== workoutId),
  }));
}

function patchWorkout(
  state: AppState,
  workoutId: string,
  updater: (workout: Workout) => Workout,
): AppState {
  return patchActiveProfile(state, (profile) => ({
    ...profile,
    workouts: profile.workouts.map((workout) =>
      workout.id === workoutId ? updater(workout) : workout,
    ),
  }));
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
  return patchActiveProfile(state, (profile) => ({
    ...profile,
    activeWorkoutId: profile.activeWorkoutId === workoutId ? null : profile.activeWorkoutId,
    workouts: profile.workouts.map((workout) =>
      workout.id === workoutId
        ? { ...workout, completedAt: new Date().toISOString() }
        : workout,
    ),
  }));
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

  return patchActiveProfile(state, (profile) => {
    const plan = profile.plan.map((day) => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        exercises: day.exercises.map((exercise) =>
          exercise.id === slotId ? { ...exercise, name: trimmed, since, unilateral } : exercise,
        ),
      };
    });

    const workouts = profile.workouts.map((workout) => {
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

    return { ...profile, plan, workouts };
  });
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
  const profile = activeProfile(state);
  const original = getDay(defaultPlanFor(profile.id), dayId)?.exercises.find(
    (exercise) => exercise.id === slotId,
  );
  if (!original) return state;
  return applyExerciseChange(
    state,
    dayId,
    slotId,
    original.name,
    original.unilateral ?? false,
  );
}

export function addBodyWeight(
  state: AppState,
  weight: number,
  recordedAt = new Date().toISOString(),
): AppState {
  if (!Number.isFinite(weight) || weight <= 0) return state;
  const entry: BodyWeightEntry = {
    id: uid(),
    weight: Math.round(weight * 100) / 100,
    recordedAt,
  };
  return patchActiveProfile(state, (profile) => ({
    ...profile,
    bodyWeights: [...profile.bodyWeights, entry].sort((a, b) =>
      a.recordedAt.localeCompare(b.recordedAt),
    ),
  }));
}

export function deleteBodyWeight(state: AppState, entryId: string): AppState {
  return patchActiveProfile(state, (profile) => ({
    ...profile,
    bodyWeights: profile.bodyWeights.filter((entry) => entry.id !== entryId),
  }));
}

export function getWorkout(state: AppState, workoutId: string | null) {
  if (!workoutId) return null;
  return activeProfile(state).workouts.find((workout) => workout.id === workoutId) ?? null;
}
