"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/stores/workout-store";

function calcRemaining(restTimerEnd: number | null) {
  if (!restTimerEnd) return 0;
  return Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000));
}

export function useRestTimer() {
  const restTimerEnd = useWorkoutStore((s) => s.restTimerEnd);
  const clearRestTimer = useWorkoutStore((s) => s.clearRestTimer);
  const [remaining, setRemaining] = useState(() => calcRemaining(restTimerEnd));

  useEffect(() => {
    if (!restTimerEnd) {
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) clearRestTimer();
    };
    tick();

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [restTimerEnd, clearRestTimer]);

  // Derive display value without setState in effect body
  const displayRemaining = restTimerEnd ? remaining : 0;

  const isActive = displayRemaining > 0;
  const minutes = Math.floor(displayRemaining / 60);
  const seconds = displayRemaining % 60;
  const formatted = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return { remaining: displayRemaining, isActive, formatted };
}
