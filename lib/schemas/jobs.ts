import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10),
  company: z.string().min(1).max(120),
  location: z.string().min(1).max(160),
  manpower: z.number().int().positive().max(100000),
  salary: z.number().int().nonnegative(),
  categoryId: z.string().uuid(),
  status: z.enum(["OPEN", "CLOSED", "FILLED"]).optional(), // defaults to OPEN in DB
});

// 🔹 PATCH schema = all create fields optional + deletedAt
export const updateJobSchema = createJobSchema.partial().extend({
  deletedAt: z.coerce.date().nullable().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
