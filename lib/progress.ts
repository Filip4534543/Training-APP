import { isUnilateral } from "./plan";
import { exerciseKey } from "./format";
import type {
  BestSet,
  ExerciseProgress,
  ExerciseTrend,
  SetEntry,
  Workout,
  WorkoutExercise,
  WorkoutProgress,
} from "./types";

export function setHasReps(set: SetEntry, unilateral = false) {
  if (unilateral) {
    return (set.repsLeft ?? 0) > 0 || (set.repsRight ?? 0) > 0;
  }
  return set.reps !== null && set.reps > 0;
}

export function filledSets(sets: SetEntry[], unilateral = false) {
  return sets.filter((set) => setHasReps(set, unilateral));
}

export function setVolume(set: SetEntry, unilateral = false) {
  const reps = unilateral
    ? (set.repsLeft ?? 0) + (set.repsRight ?? 0)
    : set.reps !== null && set.reps > 0
      ? set.reps
      : 0;
  if (reps <= 0) return 0;
  return (set.weight ?? 0) * reps;
}

export function exerciseVolume(exercise: WorkoutExercise) {
  const unilateral = isUnilateral(exercise);
  return filledSets(exercise.sets, unilateral).reduce(
    (sum, set) => sum + setVolume(set, unilateral),
    0,
  );
}

export function workoutVolume(workout: Workout) {
  return workout.exercises.reduce((sum, exercise) => sum + exerciseVolume(exercise), 0);
}

export function bestSet(exercise: WorkoutExercise): BestSet | null {
  const unilateral = isUnilateral(exercise);
  const ranked = filledSets(exercise.sets, unilateral).sort((a, b) => {
    const volumeDiff = setVolume(b, unilateral) - setVolume(a, unilateral);
    if (volumeDiff !== 0) return volumeDiff;
    return (b.weight ?? 0) - (a.weight ?? 0);
  });
  const top = ranked[0];
  if (!top) return null;
  if (unilateral) {
    return {
      weight: top.weight ?? 0,
      reps: (top.repsLeft ?? 0) + (top.repsRight ?? 0),
      repsLeft: top.repsLeft ?? 0,
      repsRight: top.repsRight ?? 0,
    };
  }
  if (top.reps === null) return null;
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
    if (found && filledSets(found.sets, isUnilateral(found)).length > 0) return found;
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
      currentSets: filledSets(exercise.sets, isUnilateral(exercise)).length,
      previousSets: previousExercise
        ? filledSets(previousExercise.sets, isUnilateral(previousExercise)).length
        : null,
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
