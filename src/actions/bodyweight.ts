"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logBodyweightSchema } from "@/schemas/bodyweight";
import { revalidatePath } from "next/cache";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getBodyweightLogs() {
  const userId = await getAuthUserId();

  return db.bodyweightLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

export async function logBodyweight(input: { weight: number; date?: string }) {
  const userId = await getAuthUserId();

  const parsed = logBodyweightSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  let logDate: Date;
  if (parsed.data.date) {
    // Parse as local date (noon) to avoid timezone shift showing previous day
    const [y, m, d] = parsed.data.date.split("-").map(Number);
    logDate = new Date(y, m - 1, d, 12, 0, 0);
  } else {
    logDate = new Date();
  }

  const data = await db.bodyweightLog.create({
    data: {
      userId,
      weight: parsed.data.weight,
      date: logDate,
    },
  });

  revalidatePath("/profile");
  return { success: true as const, data };
}

export async function deleteBodyweightLog(id: string) {
  const userId = await getAuthUserId();

  const log = await db.bodyweightLog.findFirst({
    where: { id, userId },
  });

  if (!log) {
    return { success: false as const, error: "Not found" };
  }

  await db.bodyweightLog.delete({ where: { id } });

  revalidatePath("/profile");
  return { success: true as const };
}
