"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/stores/workout-store";

export function useWorkoutTimer() {
  const startTime = useWorkoutStore((s) => s.startTime);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const formatted =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${minutes}:${String(seconds).padStart(2, "0")}`;

  return { elapsed, formatted };
}
