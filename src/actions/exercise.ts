"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createExerciseSchema, updateExerciseSchema } from "@/schemas/exercise";
import { revalidatePath } from "next/cache";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createExercise(input: {
  name: string;
  isUnilateral?: boolean;
  muscleGroup?: string;
}) {
  const userId = await getAuthUserId();
  const parsed = createExerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const existing = await db.exercise.findFirst({
    where: { userId, name: parsed.data.name },
  });
  if (existing) {
    return { success: false as const, error: "Exercise already exists" };
  }

  const exercise = await db.exercise.create({
    data: {
      userId,
      name: parsed.data.name,
      isUnilateral: parsed.data.isUnilateral ?? false,
      muscleGroup: parsed.data.muscleGroup,
    },
  });

  revalidatePath("/exercises");
  return { success: true as const, data: exercise };
}

export async function updateExercise(input: {
  id: string;
  name?: string;
  isUnilateral?: boolean;
  muscleGroup?: string | null;
}) {
  const userId = await getAuthUserId();
  const parsed = updateExerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const existing = await db.exercise.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!existing) return { success: false as const, error: "Not found" };

  const exercise = await db.exercise.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.isUnilateral !== undefined && {
        isUnilateral: parsed.data.isUnilateral,
      }),
      ...(parsed.data.muscleGroup !== undefined && {
        muscleGroup: parsed.data.muscleGroup,
      }),
    },
  });

  revalidatePath("/exercises");
  return { success: true as const, data: exercise };
}

export async function deleteExercise(id: string) {
  const userId = await getAuthUserId();

  const existing = await db.exercise.findFirst({
    where: { id, userId },
  });
  if (!existing) return { success: false as const, error: "Not found" };

  await db.exercise.delete({ where: { id } });

  revalidatePath("/exercises");
  return { success: true as const };
}

export async function getExercises() {
  const userId = await getAuthUserId();
  return db.exercise.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function addExerciseToTemplate(
  workoutTypeId: string,
  exerciseId: string
) {
  const userId = await getAuthUserId();

  const workoutType = await db.workoutType.findFirst({
    where: { id: workoutTypeId, userId },
    include: { templateExercises: true },
  });
  if (!workoutType) return { success: false as const, error: "Not found" };

  const maxOrder = Math.max(
    0,
    ...workoutType.templateExercises.map((te: { order: number }) => te.order)
  );

  const templateExercise = await db.templateExercise.create({
    data: {
      workoutTypeId,
      exerciseId,
      order: maxOrder + 1,
    },
    include: { exercise: true },
  });

  revalidatePath("/templates");
  return { success: true as const, data: templateExercise };
}

export async function removeExerciseFromTemplate(templateExerciseId: string) {
  const userId = await getAuthUserId();

  const te = await db.templateExercise.findFirst({
    where: {
      id: templateExerciseId,
      workoutType: { userId },
    },
  });
  if (!te) return { success: false as const, error: "Not found" };

  await db.templateExercise.delete({ where: { id: templateExerciseId } });

  revalidatePath("/templates");
  return { success: true as const };
}
