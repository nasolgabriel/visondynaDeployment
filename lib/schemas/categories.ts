import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
});

export const updateCategorySchema = createCategorySchema;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
