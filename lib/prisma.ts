import {
  PrismaClient,
  ApplicationStatus,
  JobStatus,
  Role,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const datasourceUrl = process.env.SUPABASE_DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("SUPABASE_DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: datasourceUrl });
const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const PrismaEnums = {
  ApplicationStatus,
  JobStatus,
  Role,
} as const;

export default prisma;
