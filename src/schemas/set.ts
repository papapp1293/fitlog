import { z } from "zod";

export const logSetSchema = z.object({
  sessionExerciseId: z.string().cuid(),
  setNumber: z.number().int().min(1),
  weight: z.number().min(0).nullable().optional(),
  reps: z.number().int().min(0).nullable().optional(),
  rir: z.number().int().min(0).max(10).nullable().optional(),
  side: z.enum(["L", "R"]).nullable().optional(),
});

export const updateSetSchema = z.object({
  id: z.string().cuid(),
  weight: z.number().min(0).nullable().optional(),
  reps: z.number().int().min(0).nullable().optional(),
  rir: z.number().int().min(0).max(10).nullable().optional(),
  completed: z.boolean().optional(),
});

export type LogSetInput = z.infer<typeof logSetSchema>;
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
