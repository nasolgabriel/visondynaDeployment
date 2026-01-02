import {
  PrismaClient,
  ApplicationStatus,
  JobStatus,
  Role,
} from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { env } from "prisma/config";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ accelerateUrl: env("PRISMA_DATABASE_URL") }).$extends(
    withAccelerate(),
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const PrismaEnums = {
  ApplicationStatus,
  JobStatus,
  Role,
} as const;

export default prisma;
