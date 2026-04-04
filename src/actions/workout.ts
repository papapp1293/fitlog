"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createWorkoutTypeSchema,
  updateWorkoutTypeSchema,
  startWorkoutSchema,
  endWorkoutSchema,
} from "@/schemas/workout";
import { revalidatePath } from "next/cache";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createWorkoutType(input: { name: string }) {
  const userId = await getAuthUserId();
  const parsed = createWorkoutTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const count = await db.workoutType.count({ where: { userId } });

  const workoutType = await db.workoutType.create({
    data: {
      userId,
      name: parsed.data.name,
      order: count,
    },
  });

  revalidatePath("/templates");
  return { success: true as const, data: workoutType };
}

export async function updateWorkoutType(input: { id: string; name: string }) {
  const userId = await getAuthUserId();
  const parsed = updateWorkoutTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const existing = await db.workoutType.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!existing) return { success: false as const, error: "Not found" };

  const workoutType = await db.workoutType.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/templates");
  return { success: true as const, data: workoutType };
}

export async function deleteWorkoutType(id: string) {
  const userId = await getAuthUserId();

  const existing = await db.workoutType.findFirst({
    where: { id, userId },
  });
  if (!existing) return { success: false as const, error: "Not found" };

  await db.workoutType.delete({ where: { id } });

  revalidatePath("/templates");
  return { success: true as const };
}

export async function getWorkoutTypes() {
  const userId = await getAuthUserId();
  return db.workoutType.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: {
      templateExercises: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
      _count: { select: { sessions: true } },
    },
  });
}

export async function startWorkout(input: { workoutTypeId: string }) {
  const userId = await getAuthUserId();
  const parsed = startWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const workoutType = await db.workoutType.findFirst({
    where: { id: parsed.data.workoutTypeId, userId },
    include: {
      templateExercises: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!workoutType) {
    return { success: false as const, error: "Workout type not found" };
  }

  const session = await db.workoutSession.create({
    data: {
      userId,
      workoutTypeId: workoutType.id,
      exercises: {
        create: workoutType.templateExercises.map((te: { exerciseId: string; order: number }) => ({
          exerciseId: te.exerciseId,
          order: te.order,
        })),
      },
    },
    include: {
      exercises: {
        include: { exercise: true, sets: true },
        orderBy: { order: "asc" },
      },
      workoutType: true,
    },
  });

  return { success: true as const, data: session };
}

export async function endWorkout(input: { sessionId: string; notes?: string }) {
  const userId = await getAuthUserId();
  const parsed = endWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const session = await db.workoutSession.findFirst({
    where: { id: parsed.data.sessionId, userId },
  });
  if (!session) return { success: false as const, error: "Session not found" };

  const updated = await db.workoutSession.update({
    where: { id: parsed.data.sessionId },
    data: {
      endedAt: new Date(),
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/");
  return { success: true as const, data: updated };
}

export async function deleteWorkoutSession(sessionId: string) {
  const userId = await getAuthUserId();

  const session = await db.workoutSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) return { success: false as const, error: "Not found" };

  await db.workoutSession.delete({ where: { id: sessionId } });

  revalidatePath("/");
  return { success: true as const };
}

export async function getWorkoutSession(sessionId: string) {
  const userId = await getAuthUserId();

  return db.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      workoutType: true,
      exercises: {
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string
) {
  const userId = await getAuthUserId();

  const session = await db.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: { exercises: true },
  });
  if (!session) return { success: false as const, error: "Session not found" };

  const maxOrder = Math.max(0, ...session.exercises.map((e: { order: number }) => e.order));

  const sessionExercise = await db.sessionExercise.create({
    data: {
      sessionId,
      exerciseId,
      order: maxOrder + 1,
    },
    include: { exercise: true, sets: true },
  });

  return { success: true as const, data: sessionExercise };
}

export async function getWorkoutType(id: string) {
  const userId = await getAuthUserId();

  return db.workoutType.findFirst({
    where: { id, userId },
    include: {
      templateExercises: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
      _count: { select: { sessions: true } },
    },
  });
}

export async function getWeeklyStats() {
  const userId = await getAuthUserId();

  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [weekCount, monthCount] = await Promise.all([
    db.workoutSession.count({
      where: {
        userId,
        endedAt: { not: null },
        startedAt: { gte: monday },
      },
    }),
    db.workoutSession.count({
      where: {
        userId,
        endedAt: { not: null },
        startedAt: { gte: firstOfMonth },
      },
    }),
  ]);

  return { weekCount, monthCount };
}

export async function getWorkoutDates(weekStart: string) {
  const userId = await getAuthUserId();

  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const sessions = await db.workoutSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
      startedAt: { gte: start, lt: end },
    },
    select: { startedAt: true },
  });

  return sessions.map((s) => s.startedAt.toISOString().split("T")[0]);
}

export async function removeExerciseFromSession(sessionExerciseId: string) {
  const userId = await getAuthUserId();

  const sessionExercise = await db.sessionExercise.findFirst({
    where: {
      id: sessionExerciseId,
      session: { userId },
    },
  });
  if (!sessionExercise) return { success: false as const, error: "Not found" };

  await db.sessionExercise.delete({ where: { id: sessionExerciseId } });

  return { success: true as const };
}
