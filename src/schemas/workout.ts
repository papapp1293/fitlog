import { z } from "zod";

export const createWorkoutTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updateWorkoutTypeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100),
});

export const startWorkoutSchema = z.object({
  workoutTypeId: z.string().cuid(),
});

export const endWorkoutSchema = z.object({
  sessionId: z.string().cuid(),
  notes: z.string().max(500).optional(),
});

export type CreateWorkoutTypeInput = z.infer<typeof createWorkoutTypeSchema>;
export type UpdateWorkoutTypeInput = z.infer<typeof updateWorkoutTypeSchema>;
export type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;
export type EndWorkoutInput = z.infer<typeof endWorkoutSchema>;
