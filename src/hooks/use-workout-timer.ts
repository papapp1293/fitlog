"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/stores/workout-store";

function calcElapsed(startTime: number | null) {
  if (!startTime) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}

export function useWorkoutTimer() {
  const startTime = useWorkoutStore((s) => s.startTime);
  const [elapsed, setElapsed] = useState(() => calcElapsed(startTime));

  useEffect(() => {
    if (!startTime) {
      return;
    }

    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  // Reset to 0 synchronously when startTime clears (no effect needed)
  const displayElapsed = startTime ? elapsed : 0;

  const hours = Math.floor(displayElapsed / 3600);
  const minutes = Math.floor((displayElapsed % 3600) / 60);
  const seconds = displayElapsed % 60;

  const formatted =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${minutes}:${String(seconds).padStart(2, "0")}`;

  return { elapsed: displayElapsed, formatted };
}
