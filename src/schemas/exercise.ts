import { z } from "zod";
import { MUSCLE_GROUPS } from "@/lib/constants";

export const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  isUnilateral: z.boolean().default(false),
  muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
});

export const updateExerciseSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100).optional(),
  isUnilateral: z.boolean().optional(),
  muscleGroup: z.enum(MUSCLE_GROUPS).nullable().optional(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
