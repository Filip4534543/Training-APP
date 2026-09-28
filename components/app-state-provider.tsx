"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { LockScreen } from "@/components/lock-screen";
import { createDefaultState, isProfileId } from "@/lib/plan";
import { UNLOCK_STORAGE_KEY } from "@/lib/pattern";
import {
  activeProfile,
  addBodyWeight,
  addPlanDay,
  addPlanExercise,
  addSet,
  changeExercise,
  completeWorkout,
  deleteBodyWeight,
  deleteWorkout,
  discardActiveWorkout,
  removePlanDay,
  removePlanExercise,
  removeSet,
  restoreDefaultExercise,
  setActiveProfile,
  setProfilePattern,
  startWorkout,
  updateExercise,
  updateSet,
} from "@/lib/state";
import type {
  AppState,
  DayId,
  ExerciseKind,
  ExercisePatch,
  Profile,
  ProfileId,
  StorageBackend,
} from "@/lib/types";

type Status = "loading" | "ready" | "error";

type AppStateContextValue = {
  state: AppState;
  profile: Profile;
  storage: StorageBackend;
  status: Status;
  error: string | null;
  unlocked: boolean;
  reload: () => Promise<void>;
  persistNow: (next: AppState) => Promise<void>;
  requestProfile: (profileId: ProfileId) => void;
  switchProfile: (profileId: ProfileId) => void;
  startDay: (dayId: DayId) => AppState;
  discardActive: () => void;
  patchSet: (
    workoutId: string,
    slotId: string,
    setId: string,
    patch: { weight?: number | null; reps?: number | null; repsLeft?: number | null; repsRight?: number | null },
  ) => void;
  addExerciseSet: (workoutId: string, slotId: string) => void;
  removeExerciseSet: (workoutId: string, slotId: string, setId: string) => void;
  finishWorkout: (workoutId: string) => Promise<AppState>;
  removeWorkout: (workoutId: string) => void;
  renameExercise: (dayId: DayId, slotId: string, name: string) => void;
  updateExerciseDetails: (dayId: DayId, slotId: string, patch: ExercisePatch) => void;
  resetExercise: (dayId: DayId, slotId: string) => void;
  addDay: (name: string, focus?: string) => void;
  addExercise: (
    dayId: DayId,
    input: { name: string; kind?: ExerciseKind; setsMin?: number; repsMin?: number; repsMax?: number },
  ) => void;
  removeExercise: (dayId: DayId, slotId: string) => void;
  removeDay: (dayId: DayId) => void;
  savePattern: (profileId: ProfileId, hash: string) => void;
  logWeight: (weight: number, recordedAt?: string) => void;
  removeWeight: (entryId: string) => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

async function fetchState() {
  const response = await fetch("/api/state", { cache: "no-store" });
  if (!response.ok) throw new Error("fetch failed");
  return (await response.json()) as { state: AppState; storage: StorageBackend };
}

async function putState(state: AppState) {
  const response = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  if (!response.ok) throw new Error("save failed");
  return (await response.json()) as { state: AppState; storage: StorageBackend };
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(createDefaultState());
  const [storage, setStorage] = useState<StorageBackend>("local-file");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [lockProfileId, setLockProfileId] = useState<ProfileId>("filip");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
  }, [state]);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const payload = await fetchState();
      latest.current = payload.state;
      setState(payload.state);
      setStorage(payload.storage);
      setStatus("ready");
    } catch {
      setError("Nie udało się wczytać treningów. Sprawdź połączenie i spróbuj ponownie.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchState()
      .then((payload) => {
        if (cancelled) return;
        latest.current = payload.state;
        setState(payload.state);
        setStorage(payload.storage);
        setStatus("ready");
        const stored = sessionStorage.getItem(UNLOCK_STORAGE_KEY);
        if (isProfileId(stored)) {
          if (payload.state.activeProfileId !== stored) {
            const next = setActiveProfile(payload.state, stored);
            latest.current = next;
            setState(next);
          }
          setLockProfileId(stored);
          setUnlocked(true);
        } else {
          setLockProfileId(payload.state.activeProfileId);
          setUnlocked(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("Nie udało się wczytać treningów. Sprawdź połączenie i spróbuj ponownie.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const queueSave = useCallback((next: AppState) => {
    latest.current = next;
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void putState(latest.current)
        .then((payload) => setStorage(payload.storage))
        .catch(() => toast.error("Nie zapisano zmian. Spróbuj jeszcze raz."));
    }, 350);
  }, []);

  const persistNow = useCallback(async (next: AppState) => {
    if (timer.current) clearTimeout(timer.current);
    latest.current = next;
    setState(next);
    const payload = await putState(next);
    latest.current = payload.state;
    setStorage(payload.storage);
    setState(payload.state);
  }, []);

  const profile = useMemo(() => activeProfile(state), [state]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      profile,
      storage,
      status,
      error,
      unlocked,
      reload,
      persistNow,
      requestProfile: (profileId) => {
        if (unlocked && profileId === latest.current.activeProfileId) return;
        sessionStorage.removeItem(UNLOCK_STORAGE_KEY);
        setLockProfileId(profileId);
        setUnlocked(false);
      },
      switchProfile: (profileId) => {
        queueSave(setActiveProfile(latest.current, profileId));
      },
      startDay: (dayId) => {
        const next = startWorkout(latest.current, dayId);
        queueSave(next);
        return next;
      },
      discardActive: () => queueSave(discardActiveWorkout(latest.current)),
      patchSet: (workoutId, slotId, setId, patch) =>
        queueSave(updateSet(latest.current, workoutId, slotId, setId, patch)),
      addExerciseSet: (workoutId, slotId) =>
        queueSave(addSet(latest.current, workoutId, slotId)),
      removeExerciseSet: (workoutId, slotId, setId) =>
        queueSave(removeSet(latest.current, workoutId, slotId, setId)),
      finishWorkout: async (workoutId) => {
        const next = completeWorkout(latest.current, workoutId);
        await persistNow(next);
        toast.success("Trening zapisany.");
        return next;
      },
      removeWorkout: (workoutId) => {
        queueSave(deleteWorkout(latest.current, workoutId));
        toast.success("Trening usunięty z historii.");
      },
      renameExercise: (dayId, slotId, name) => {
        queueSave(changeExercise(latest.current, dayId, slotId, name));
        toast.message("Ćwiczenie zmienione. Statystyki liczą się od nowa.");
      },
      updateExerciseDetails: (dayId, slotId, patch) => {
        queueSave(updateExercise(latest.current, dayId, slotId, patch));
        toast.message("Ćwiczenie zapisane.");
      },
      resetExercise: (dayId, slotId) => {
        queueSave(restoreDefaultExercise(latest.current, dayId, slotId));
        toast.message("Przywrócono ćwiczenie z planu. Statystyki od zera.");
      },
      addDay: (name, focus) => {
        queueSave(addPlanDay(latest.current, name, focus));
        toast.success("Dodano dzień.");
      },
      addExercise: (dayId, input) => {
        queueSave(addPlanExercise(latest.current, dayId, input));
        toast.success("Dodano ćwiczenie.");
      },
      removeExercise: (dayId, slotId) => {
        queueSave(removePlanExercise(latest.current, dayId, slotId));
        toast.success("Usunięto ćwiczenie.");
      },
      removeDay: (dayId) => {
        queueSave(removePlanDay(latest.current, dayId));
        toast.success("Usunięto dzień.");
      },
      savePattern: (profileId, hash) => {
        queueSave(setProfilePattern(latest.current, profileId, hash));
        toast.success("Zapisano wzór.");
      },
      logWeight: (weight, recordedAt) => {
        queueSave(addBodyWeight(latest.current, weight, recordedAt));
        toast.success("Zapisano wagę.");
      },
      removeWeight: (entryId) => {
        queueSave(deleteBodyWeight(latest.current, entryId));
        toast.success("Usunięto pomiar.");
      },
    }),
    [error, persistNow, profile, queueSave, reload, state, status, storage, unlocked],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
      {status === "ready" && !unlocked ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-background">
          <LockScreen
            key={lockProfileId}
            profiles={state.profiles}
            selectedId={lockProfileId}
            onSelect={setLockProfileId}
            onSetPattern={(id, hash) => {
              queueSave(setProfilePattern(latest.current, id, hash));
            }}
            onUnlocked={(id) => {
              sessionStorage.setItem(UNLOCK_STORAGE_KEY, id);
              queueSave(setActiveProfile(latest.current, id));
              setUnlocked(true);
            }}
          />
        </div>
      ) : null}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
