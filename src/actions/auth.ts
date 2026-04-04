"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcryptjs";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { success: false as const, error: "Email already in use" };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

  return { success: true as const };
}
