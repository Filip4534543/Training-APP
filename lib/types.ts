export type DayId = 1 | 2;

export type DayTone = "rose" | "sky" | "emerald" | "amber";

export type ProfileId = "filip" | "patrycja";

export type ExerciseTemplate = {
  id: string;
  name: string;
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  unilateral?: boolean;
  note?: string;
  /** ISO date — when the name last changed, stats start from this point. */
  since?: string;
};

export type DayPlan = {
  id: DayId;
  name: string;
  focus: string;
  tone: DayTone;
  exercises: ExerciseTemplate[];
};

export type SetEntry = {
  id: string;
  weight: number | null;
  reps: number | null;
  repsLeft: number | null;
  repsRight: number | null;
};

export type WorkoutExercise = {
  slotId: string;
  name: string;
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  unilateral?: boolean;
  note?: string;
  since?: string;
  sets: SetEntry[];
};

export type Workout = {
  id: string;
  dayId: DayId;
  startedAt: string;
  completedAt: string | null;
  exercises: WorkoutExercise[];
};

export type BodyWeightEntry = {
  id: string;
  weight: number;
  recordedAt: string;
};

export type Profile = {
  id: ProfileId;
  name: string;
  plan: DayPlan[];
  workouts: Workout[];
  activeWorkoutId: string | null;
  bodyWeights: BodyWeightEntry[];
};

export type AppState = {
  version: 3;
  activeProfileId: ProfileId;
  profiles: Profile[];
};

export type StorageBackend = "netlify-blobs" | "local-file";

export type StatePayload = {
  state: AppState;
  storage: StorageBackend;
};

export type ExerciseTrend = "up" | "down" | "same" | "new";

export type BestSet = {
  weight: number;
  reps: number;
  repsLeft?: number;
  repsRight?: number;
};

export type ExerciseProgress = {
  slotId: string;
  name: string;
  trend: ExerciseTrend;
  currentVolume: number;
  previousVolume: number | null;
  currentBest: BestSet | null;
  previousBest: BestSet | null;
  currentSets: number;
  previousSets: number | null;
  volumeDelta: number | null;
  note?: string;
};

export type WorkoutProgress = {
  previousWorkout: Workout | null;
  previousDate: string | null;
  totalVolumeDelta: number | null;
  improved: number;
  declined: number;
  unchanged: number;
  fresh: number;
  exercises: ExerciseProgress[];
};

export type FirstSetPoint = {
  workoutId: string;
  at: string;
  weight: number | null;
  reps: number | null;
  repsLeft: number | null;
  repsRight: number | null;
  unilateral: boolean;
};
