import {
  createDefaultState,
  defaultPlanFor,
  emptyProfile,
  exerciseKind,
  getDay,
  isBodyweight,
  isProfileId,
  nextDayTone,
  PROFILE_SEEDS,
} from "./plan";
import type {
  AppState,
  BodyWeightEntry,
  DayId,
  DayPlan,
  ExerciseKind,
  ExercisePatch,
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

function emptySet(weight: number | null = null): SetEntry {
  return {
    id: uid(),
    weight,
    reps: null,
    repsLeft: null,
    repsRight: null,
  };
}

function emptySets(count: number, weight: number | null = null): SetEntry[] {
  return Array.from({ length: Math.max(1, count) }, () => emptySet(weight));
}

export function latestBodyWeight(profile: Pick<Profile, "bodyWeights">) {
  return profile.bodyWeights.at(-1)?.weight ?? null;
}

function toWorkoutExercise(template: ExerciseTemplate, bodyWeight: number | null): WorkoutExercise {
  const kind = exerciseKind(template);
  return {
    slotId: template.id,
    name: template.name,
    setsMin: template.setsMin,
    setsMax: template.setsMax,
    repsMin: template.repsMin,
    repsMax: template.repsMax,
    kind,
    unilateral: kind === "unilateral",
    note: template.note,
    since: template.since,
    sets: emptySets(template.setsMin, kind === "bodyweight" ? bodyWeight : null),
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

function normalizeTemplate(
  input: Partial<ExerciseTemplate> & { id?: string; name?: string },
): ExerciseTemplate {
  const name = input.name?.trim() || "Ćwiczenie";
  const kind = exerciseKind(input);
  return {
    id: typeof input.id === "string" && input.id ? input.id : uid(),
    name,
    setsMin: input.setsMin ?? 3,
    setsMax: input.setsMax ?? input.setsMin ?? 3,
    repsMin: input.repsMin ?? 8,
    repsMax: input.repsMax ?? 12,
    kind,
    unilateral: kind === "unilateral",
    note: input.note,
    since: input.since,
  };
}

function normalizeWorkout(workout: Workout): Workout {
  return {
    ...workout,
    exercises: (workout.exercises ?? []).map((exercise) => {
      const kind = exerciseKind(exercise);
      return {
        ...exercise,
        kind,
        unilateral: kind === "unilateral",
        sets: (exercise.sets ?? []).map(normalizeSet),
      };
    }),
  };
}

function mergeExercise(seed: ExerciseTemplate, saved?: Partial<ExerciseTemplate>): ExerciseTemplate {
  if (!saved) return seed;
  const savedName = saved.name?.trim() || seed.name;
  const name = !saved.since && savedName === "Poprzecznie" ? seed.name : savedName;
  const kind = saved.since
    ? exerciseKind({ ...saved, name })
    : exerciseKind({
        ...seed,
        ...saved,
        name,
        kind: saved.kind ?? seed.kind,
      });
  return {
    ...seed,
    name,
    since: saved.since,
    kind,
    unilateral: kind === "unilateral",
    setsMin: saved.setsMin ?? seed.setsMin,
    setsMax: saved.setsMax ?? seed.setsMax,
    repsMin: saved.repsMin ?? seed.repsMin,
    repsMax: saved.repsMax ?? seed.repsMax,
  };
}

function mergePlan(defaultPlan: DayPlan[], saved: DayPlan[] | undefined): DayPlan[] {
  const mergedDefaults = defaultPlan.map((day) => {
    const existing = saved?.find((item) => item.id === day.id);
    if (!existing) return day;
    const seedExercises = day.exercises.map((exercise) => {
      const savedExercise = existing.exercises.find((item) => item.id === exercise.id);
      return mergeExercise(exercise, savedExercise);
    });
    const extra = existing.exercises
      .filter((item) => !day.exercises.some((seed) => seed.id === item.id))
      .map(normalizeTemplate);
    return {
      ...day,
      name: existing.name?.trim() || day.name,
      focus: existing.focus?.trim() || day.focus,
      tone: existing.tone || day.tone,
      exercises: [...seedExercises, ...extra],
    };
  });

  const extraDays = (saved ?? [])
    .filter(
      (day) =>
        Number.isInteger(day.id) &&
        day.id > 0 &&
        !defaultPlan.some((seed) => seed.id === day.id),
    )
    .map((day) => ({
      id: day.id,
      name: day.name?.trim() || `Dzień ${day.id}`,
      focus: day.focus?.trim() || "Plan",
      tone: day.tone || nextDayTone(mergedDefaults),
      exercises: (day.exercises ?? []).map(normalizeTemplate),
    }));

  return [...mergedDefaults, ...extraDays].sort((a, b) => a.id - b.id);
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
      .filter((workout) => Number.isInteger(workout.dayId) && workout.dayId > 0)
      .map(normalizeWorkout),
    activeWorkoutId: saved?.activeWorkoutId ?? null,
    bodyWeights: (saved?.bodyWeights ?? [])
      .map(normalizeBodyWeight)
      .filter((entry): entry is BodyWeightEntry => Boolean(entry))
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    patternHash:
      typeof saved?.patternHash === "string" && saved.patternHash.length >= 32
        ? saved.patternHash
        : null,
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

export function setProfilePattern(state: AppState, profileId: ProfileId, patternHash: string): AppState {
  return {
    ...state,
    profiles: state.profiles.map((profile) =>
      profile.id === profileId ? { ...profile, patternHash } : profile,
    ),
  };
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
    if (!day || day.exercises.length === 0) return profile;

    const bodyWeight = latestBodyWeight(profile);
    const workout: Workout = {
      id: uid(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      dayId,
      exercises: day.exercises.map((template) => toWorkoutExercise(template, bodyWeight)),
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
  const bodyWeight = latestBodyWeight(activeProfile(state));
  return patchExercise(state, workoutId, slotId, (exercise) => {
    const last = exercise.sets[exercise.sets.length - 1];
    const fallback = isBodyweight(exercise) ? bodyWeight : null;
    return {
      ...exercise,
      sets: [
        ...exercise.sets,
        {
          id: uid(),
          weight: last?.weight ?? fallback,
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

export function updateExercise(
  state: AppState,
  dayId: DayId,
  slotId: string,
  patch: ExercisePatch,
): AppState {
  const profile = activeProfile(state);
  const current = getDay(profile.plan, dayId)?.exercises.find((item) => item.id === slotId);
  if (!current) return state;
  const name = (patch.name ?? current.name).trim();
  if (!name) return state;
  const kind: ExerciseKind = patch.kind ?? exerciseKind(current);
  const identityChanged = name !== current.name || kind !== exerciseKind(current);
  const since = identityChanged ? new Date().toISOString() : current.since;
  const bodyWeight = latestBodyWeight(profile);

  return patchActiveProfile(state, (item) => {
    const plan = item.plan.map((day) => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        exercises: day.exercises.map((exercise) =>
          exercise.id === slotId
            ? {
                ...exercise,
                name,
                kind,
                unilateral: kind === "unilateral",
                since,
                setsMin: patch.setsMin ?? exercise.setsMin,
                setsMax: patch.setsMax ?? patch.setsMin ?? exercise.setsMax,
                repsMin: patch.repsMin ?? exercise.repsMin,
                repsMax: patch.repsMax ?? exercise.repsMax,
              }
            : exercise,
        ),
      };
    });

    const workouts = item.workouts.map((workout) => {
      if (workout.completedAt) return workout;
      if (workout.dayId !== dayId) return workout;
      return {
        ...workout,
        exercises: workout.exercises.map((exercise) => {
          if (exercise.slotId !== slotId) return exercise;
          return {
            ...exercise,
            name,
            kind,
            unilateral: kind === "unilateral",
            since,
            setsMin: patch.setsMin ?? exercise.setsMin,
            setsMax: patch.setsMax ?? patch.setsMin ?? exercise.setsMax,
            repsMin: patch.repsMin ?? exercise.repsMin,
            repsMax: patch.repsMax ?? exercise.repsMax,
            sets: identityChanged
              ? exercise.sets.map((set) => ({
                  ...set,
                  weight: kind === "bodyweight" ? bodyWeight : null,
                  reps: null,
                  repsLeft: null,
                  repsRight: null,
                }))
              : exercise.sets,
          };
        }),
      };
    });

    return { ...item, plan, workouts };
  });
}

export function changeExercise(
  state: AppState,
  dayId: DayId,
  slotId: string,
  name: string,
): AppState {
  return updateExercise(state, dayId, slotId, { name });
}

export function restoreDefaultExercise(state: AppState, dayId: DayId, slotId: string): AppState {
  const profile = activeProfile(state);
  const original = getDay(defaultPlanFor(profile.id), dayId)?.exercises.find(
    (exercise) => exercise.id === slotId,
  );
  if (!original) return state;
  return updateExercise(state, dayId, slotId, {
    name: original.name,
    kind: exerciseKind(original),
    setsMin: original.setsMin,
    setsMax: original.setsMax,
    repsMin: original.repsMin,
    repsMax: original.repsMax,
  });
}

export function addPlanDay(state: AppState, name: string, focus = ""): AppState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  return patchActiveProfile(state, (profile) => {
    const id = Math.max(0, ...profile.plan.map((day) => day.id)) + 1;
    const day: DayPlan = {
      id,
      name: trimmed,
      focus: focus.trim() || "Nowy plan",
      tone: nextDayTone(profile.plan),
      exercises: [],
    };
    return { ...profile, plan: [...profile.plan, day] };
  });
}

export function updatePlanDay(
  state: AppState,
  dayId: DayId,
  patch: { name?: string; focus?: string },
): AppState {
  return patchActiveProfile(state, (profile) => ({
    ...profile,
    plan: profile.plan.map((day) =>
      day.id === dayId
        ? {
            ...day,
            name: patch.name?.trim() || day.name,
            focus: patch.focus?.trim() || day.focus,
          }
        : day,
    ),
  }));
}

export function removePlanDay(state: AppState, dayId: DayId): AppState {
  return patchActiveProfile(state, (profile) => {
    if (profile.plan.length <= 1) return profile;
    if (!profile.plan.some((day) => day.id === dayId)) return profile;
    return {
      ...profile,
      plan: profile.plan.filter((day) => day.id !== dayId),
      activeWorkoutId:
        profile.workouts.find((workout) => workout.id === profile.activeWorkoutId)?.dayId === dayId
          ? null
          : profile.activeWorkoutId,
      workouts: profile.workouts.filter(
        (workout) => workout.dayId !== dayId || workout.completedAt,
      ),
    };
  });
}

export function addPlanExercise(
  state: AppState,
  dayId: DayId,
  input: { name: string; kind?: ExerciseKind; setsMin?: number; repsMin?: number; repsMax?: number },
): AppState {
  const name = input.name.trim();
  if (!name) return state;
  return patchActiveProfile(state, (profile) => ({
    ...profile,
    plan: profile.plan.map((day) => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        exercises: [
          ...day.exercises,
          normalizeTemplate({
            name,
            kind: input.kind ?? "normal",
            setsMin: input.setsMin ?? 3,
            setsMax: input.setsMin ?? 3,
            repsMin: input.repsMin ?? 8,
            repsMax: input.repsMax ?? 12,
          }),
        ],
      };
    }),
  }));
}

export function removePlanExercise(state: AppState, dayId: DayId, slotId: string): AppState {
  return patchActiveProfile(state, (profile) => ({
    ...profile,
    plan: profile.plan.map((day) => {
      if (day.id !== dayId) return day;
      return { ...day, exercises: day.exercises.filter((exercise) => exercise.id !== slotId) };
    }),
    workouts: profile.workouts.map((workout) => {
      if (workout.completedAt || workout.dayId !== dayId) return workout;
      return {
        ...workout,
        exercises: workout.exercises.filter((exercise) => exercise.slotId !== slotId),
      };
    }),
  }));
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
