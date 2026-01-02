import { z } from "zod";

// Accepts "YYYY-MM-DD" from <input type="date"> or any ISO-ish date string
export const zDateISO = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");

export const toDate = (s?: string | null) => (s ? new Date(s) : undefined);
