import { exerciseKey } from "./format";
import type {
  ExerciseProgress,
  ExerciseTrend,
  SetEntry,
  Workout,
  WorkoutExercise,
  WorkoutProgress,
} from "./types";

export function filledSets(sets: SetEntry[]) {
  return sets.filter((set) => set.reps !== null && set.reps > 0);
}

export function setVolume(set: SetEntry) {
  if (set.reps === null || set.reps <= 0) return 0;
  const weight = set.weight ?? 0;
  return weight * set.reps;
}

export function exerciseVolume(exercise: WorkoutExercise) {
  return filledSets(exercise.sets).reduce((sum, set) => sum + setVolume(set), 0);
}

export function workoutVolume(workout: Workout) {
  return workout.exercises.reduce((sum, exercise) => sum + exerciseVolume(exercise), 0);
}

export function bestSet(exercise: WorkoutExercise) {
  const ranked = filledSets(exercise.sets).sort((a, b) => {
    const volumeDiff = setVolume(b) - setVolume(a);
    if (volumeDiff !== 0) return volumeDiff;
    return (b.weight ?? 0) - (a.weight ?? 0);
  });
  const top = ranked[0];
  if (!top || top.reps === null) return null;
  return { weight: top.weight ?? 0, reps: top.reps };
}

export function lastCompletedForDay(workouts: Workout[], dayId: number, beforeId?: string) {
  return (
    workouts
      .filter(
        (workout) =>
          workout.dayId === dayId &&
          workout.completedAt &&
          workout.id !== beforeId,
      )
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0] ?? null
  );
}

export function lastLoggedExercise(
  workouts: Workout[],
  name: string,
  since?: string,
  excludeWorkoutId?: string,
) {
  const key = exerciseKey(name);
  const matches = workouts
    .filter((workout) => workout.completedAt && workout.id !== excludeWorkoutId)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  for (const workout of matches) {
    if (since && (workout.completedAt ?? "") < since) continue;
    const found = workout.exercises.find((exercise) => exerciseKey(exercise.name) === key);
    if (found && filledSets(found.sets).length > 0) return found;
  }
  return null;
}

function trendFor(current: number, previous: number | null): ExerciseTrend {
  if (previous === null) return "new";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "same";
}

export function compareWorkouts(current: Workout, previous: Workout | null): WorkoutProgress {
  const exercises: ExerciseProgress[] = current.exercises.map((exercise) => {
    const previousExercise = previous?.exercises.find(
      (candidate) => exerciseKey(candidate.name) === exerciseKey(exercise.name),
    );
    const currentVolume = exerciseVolume(exercise);
    const previousVolume = previousExercise ? exerciseVolume(previousExercise) : null;
    const isFresh = !previousExercise;

    return {
      slotId: exercise.slotId,
      name: exercise.name,
      trend: isFresh ? "new" : trendFor(currentVolume, previousVolume),
      currentVolume,
      previousVolume,
      currentBest: bestSet(exercise),
      previousBest: previousExercise ? bestSet(previousExercise) : null,
      currentSets: filledSets(exercise.sets).length,
      previousSets: previousExercise ? filledSets(previousExercise.sets).length : null,
      volumeDelta: previousVolume === null ? null : currentVolume - previousVolume,
      note: exercise.note,
    };
  });

  const comparable = exercises.filter((item) => item.trend !== "new");
  const currentTotal = exercises.reduce((sum, item) => sum + item.currentVolume, 0);
  const previousTotal = comparable.reduce((sum, item) => sum + (item.previousVolume ?? 0), 0);

  return {
    previousWorkout: previous,
    previousDate: previous?.completedAt ?? null,
    totalVolumeDelta:
      previous && comparable.length > 0 ? currentTotal - previousTotal : null,
    improved: exercises.filter((item) => item.trend === "up").length,
    declined: exercises.filter((item) => item.trend === "down").length,
    unchanged: exercises.filter((item) => item.trend === "same").length,
    fresh: exercises.filter((item) => item.trend === "new").length,
    exercises,
  };
}
