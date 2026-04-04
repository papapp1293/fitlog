"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/stores/workout-store";

export function useRestTimer() {
  const restTimerEnd = useWorkoutStore((s) => s.restTimerEnd);
  const clearRestTimer = useWorkoutStore((s) => s.clearRestTimer);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!restTimerEnd) {
      setRemaining(0);
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

  const isActive = remaining > 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return { remaining, isActive, formatted };
}
