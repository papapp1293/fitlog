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

export interface WorkoutHistoryItem {
  id: string;
  workoutTypeName: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
}

export async function getWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  const userId = await getAuthUserId();

  const sessions = await db.workoutSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
    },
    include: {
      workoutType: { select: { name: true } },
      exercises: {
        include: {
          sets: { where: { completed: true } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return sessions.map((s) => {
    let totalSets = 0;
    let totalVolume = 0;

    for (const ex of s.exercises) {
      totalSets += ex.sets.length;
      for (const set of ex.sets) {
        totalVolume += (set.weight ?? 0) * (set.reps ?? 0);
      }
    }

    const durationMinutes = Math.round(
      (s.endedAt!.getTime() - s.startedAt.getTime()) / 60000
    );

    return {
      id: s.id,
      workoutTypeName: s.workoutType.name,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt!.toISOString(),
      durationMinutes,
      exerciseCount: s.exercises.length,
      totalSets,
      totalVolume: Math.round(totalVolume),
    };
  });
}

export interface WorkoutSessionDetail {
  id: string;
  workoutTypeName: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  notes: string | null;
  exercises: {
    id: string;
    name: string;
    isUnilateral: boolean;
    sets: {
      setNumber: number;
      weight: number | null;
      reps: number | null;
      rir: number | null;
      side: string | null;
      completed: boolean;
    }[];
  }[];
}

export async function getWorkoutSessionDetail(
  sessionId: string
): Promise<WorkoutSessionDetail | null> {
  const userId = await getAuthUserId();

  const session = await db.workoutSession.findFirst({
    where: { id: sessionId, userId, endedAt: { not: null } },
    include: {
      workoutType: { select: { name: true } },
      exercises: {
        include: {
          exercise: { select: { name: true, isUnilateral: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!session) return null;

  const durationMinutes = Math.round(
    (session.endedAt!.getTime() - session.startedAt.getTime()) / 60000
  );

  return {
    id: session.id,
    workoutTypeName: session.workoutType.name,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt!.toISOString(),
    durationMinutes,
    notes: session.notes,
    exercises: session.exercises.map((ex) => ({
      id: ex.id,
      name: ex.exercise.name,
      isUnilateral: ex.exercise.isUnilateral,
      sets: ex.sets.map((s) => ({
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        rir: s.rir,
        side: s.side,
        completed: s.completed,
      })),
    })),
  };
}
