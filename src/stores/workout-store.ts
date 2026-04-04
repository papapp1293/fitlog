import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkoutStore {
  // Active session
  activeSessionId: string | null;
  startTime: number | null;

  // Rest timer
  restTimerEnd: number | null;
  restDuration: number; // seconds

  // Actions
  setActiveSession: (sessionId: string, startTime?: number) => void;
  clearActiveSession: () => void;
  startRestTimer: (durationSeconds?: number) => void;
  clearRestTimer: () => void;
  setRestDuration: (seconds: number) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      activeSessionId: null,
      startTime: null,
      restTimerEnd: null,
      restDuration: 180,

      setActiveSession: (sessionId, startTime) =>
        set({ activeSessionId: sessionId, startTime: startTime ?? Date.now() }),

      clearActiveSession: () =>
        set({
          activeSessionId: null,
          startTime: null,
          restTimerEnd: null,
        }),

      startRestTimer: (durationSeconds) =>
        set((state) => ({
          restTimerEnd:
            Date.now() + (durationSeconds ?? state.restDuration) * 1000,
        })),

      clearRestTimer: () => set({ restTimerEnd: null }),

      setRestDuration: (seconds) => set({ restDuration: seconds }),
    }),
    {
      name: "workout-store",
    }
  )
);
