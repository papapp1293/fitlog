"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export interface ExerciseHistoryPoint {
  date: string;
  volume: number;
  bestWeight: number;
  bestReps: number;
  totalSets: number;
}

export async function getExerciseHistory(
  exerciseId: string
): Promise<ExerciseHistoryPoint[]> {
  const userId = await getAuthUserId();

  // Verify exercise ownership
  const exercise = await db.exercise.findFirst({
    where: { id: exerciseId, userId },
  });
  if (!exercise) return [];

  const sessionExercises = await db.sessionExercise.findMany({
    where: {
      exerciseId,
      session: {
        userId,
        endedAt: { not: null },
      },
    },
    include: {
      sets: { orderBy: { setNumber: "asc" } },
      session: { select: { startedAt: true } },
    },
    orderBy: { session: { startedAt: "asc" } },
  });

  return sessionExercises.map((se) => {
    const completedSets = se.sets.filter((s) => s.completed);

    let volume = 0;
    let bestWeight = 0;
    let bestReps = 0;

    for (const set of completedSets) {
      const w = set.weight ?? 0;
      const r = set.reps ?? 0;
      volume += w * r;
      if (w > bestWeight) {
        bestWeight = w;
        bestReps = r;
      }
    }

    return {
      date: se.session.startedAt.toISOString(),
      volume: Math.round(volume),
      bestWeight,
      bestReps,
      totalSets: completedSets.length,
    };
  });
}

export async function getExerciseById(exerciseId: string) {
  const userId = await getAuthUserId();

  return db.exercise.findFirst({
    where: { id: exerciseId, userId },
  });
}
