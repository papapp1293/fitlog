"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSetSchema, updateSetSchema } from "@/schemas/set";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function logSet(input: {
  sessionExerciseId: string;
  setNumber: number;
  weight?: number | null;
  reps?: number | null;
  rir?: number | null;
  side?: "L" | "R" | null;
}) {
  const userId = await getAuthUserId();
  const parsed = logSetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  // Verify ownership
  const sessionExercise = await db.sessionExercise.findFirst({
    where: {
      id: parsed.data.sessionExerciseId,
      session: { userId },
    },
  });
  if (!sessionExercise) return { success: false as const, error: "Not found" };

  const set = await db.setEntry.create({
    data: {
      sessionExerciseId: parsed.data.sessionExerciseId,
      setNumber: parsed.data.setNumber,
      weight: parsed.data.weight ?? null,
      reps: parsed.data.reps ?? null,
      rir: parsed.data.rir ?? null,
      side: parsed.data.side ?? null,
      completed: true,
    },
  });

  return { success: true as const, data: set };
}

export async function updateSet(input: {
  id: string;
  weight?: number | null;
  reps?: number | null;
  rir?: number | null;
  completed?: boolean;
}) {
  const userId = await getAuthUserId();
  const parsed = updateSetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const set = await db.setEntry.findFirst({
    where: {
      id: parsed.data.id,
      sessionExercise: { session: { userId } },
    },
  });
  if (!set) return { success: false as const, error: "Not found" };

  const updated = await db.setEntry.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.weight !== undefined && { weight: parsed.data.weight }),
      ...(parsed.data.reps !== undefined && { reps: parsed.data.reps }),
      ...(parsed.data.rir !== undefined && { rir: parsed.data.rir }),
      ...(parsed.data.completed !== undefined && {
        completed: parsed.data.completed,
      }),
    },
  });

  return { success: true as const, data: updated };
}

export async function deleteSet(id: string) {
  const userId = await getAuthUserId();

  const set = await db.setEntry.findFirst({
    where: {
      id,
      sessionExercise: { session: { userId } },
    },
  });
  if (!set) return { success: false as const, error: "Not found" };

  await db.setEntry.delete({ where: { id } });

  return { success: true as const };
}

export async function getPreviousSets(exerciseId: string) {
  const userId = await getAuthUserId();

  const lastSessionExercise = await db.sessionExercise.findFirst({
    where: {
      exerciseId,
      session: {
        userId,
        endedAt: { not: null },
      },
    },
    orderBy: {
      session: { startedAt: "desc" },
    },
    include: {
      sets: { orderBy: { setNumber: "asc" } },
    },
  });

  return lastSessionExercise?.sets ?? [];
}
