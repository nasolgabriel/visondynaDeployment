// lib/schemas/applications.ts
import { z } from "zod";

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEWED",
    "OFFERED",
    "HIRED",
    "REJECTED",
  ]),
});
