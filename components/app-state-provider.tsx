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
import { createDefaultState } from "@/lib/plan";
import {
  addSet,
  changeExercise,
  completeWorkout,
  discardActiveWorkout,
  removeSet,
  restoreDefaultExercise,
  startWorkout,
  updateSet,
} from "@/lib/state";
import type { AppState, DayId, StorageBackend } from "@/lib/types";

type Status = "loading" | "ready" | "error";

type AppStateContextValue = {
  state: AppState;
  storage: StorageBackend;
  status: Status;
  error: string | null;
  reload: () => Promise<void>;
  persistNow: (next: AppState) => Promise<void>;
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
  renameExercise: (dayId: DayId, slotId: string, name: string) => void;
  resetExercise: (dayId: DayId, slotId: string) => void;
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

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      storage,
      status,
      error,
      reload,
      persistNow,
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
      renameExercise: (dayId, slotId, name) => {
        queueSave(changeExercise(latest.current, dayId, slotId, name));
        toast.message("Ćwiczenie zmienione. Statystyki liczą się od nowa.");
      },
      resetExercise: (dayId, slotId) => {
        queueSave(restoreDefaultExercise(latest.current, dayId, slotId));
        toast.message("Przywrócono ćwiczenie z planu. Statystyki od zera.");
      },
    }),
    [error, persistNow, queueSave, reload, state, status, storage],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
