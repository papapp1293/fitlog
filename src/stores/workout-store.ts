import { create } from "zustand";

interface WorkoutStore {
  // Active session
  activeSessionId: string | null;
  startTime: number | null;

  // Rest timer
  restTimerEnd: number | null;
  restDuration: number; // seconds

  // Actions
  setActiveSession: (sessionId: string) => void;
  clearActiveSession: () => void;
  startRestTimer: (durationSeconds?: number) => void;
  clearRestTimer: () => void;
  setRestDuration: (seconds: number) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  activeSessionId: null,
  startTime: null,
  restTimerEnd: null,
  restDuration: 180,

  setActiveSession: (sessionId) =>
    set({ activeSessionId: sessionId, startTime: Date.now() }),

  clearActiveSession: () =>
    set({
      activeSessionId: null,
      startTime: null,
      restTimerEnd: null,
    }),

  startRestTimer: (durationSeconds) =>
    set((state) => ({
      restTimerEnd: Date.now() + (durationSeconds ?? state.restDuration) * 1000,
    })),

  clearRestTimer: () => set({ restTimerEnd: null }),

  setRestDuration: (seconds) => set({ restDuration: seconds }),
}));
