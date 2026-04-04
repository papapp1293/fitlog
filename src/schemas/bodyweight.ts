import { z } from "zod";

export const logBodyweightSchema = z.object({
  weight: z.number().positive("Weight must be positive").max(999),
  date: z.string().optional(),
});

export type LogBodyweightInput = z.infer<typeof logBodyweightSchema>;
