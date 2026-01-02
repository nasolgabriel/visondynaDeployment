// lib/job-recommendation.ts
import prisma from "./prisma";
import type { Prisma } from "@prisma/client";

/**
 * Builds a smart recommendation-aware JobWhereInput
 */
export async function buildRecommendedJobWhere(
  userId: string | null,
): Promise<Prisma.JobWhereInput> {
  const base: Prisma.JobWhereInput = {
    status: "OPEN",
    deletedAt: null,
  };

  if (!userId) return base;

  // 1) Get profile skills and skill categories
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      skills: {
        select: {
          skillId: true,
          skill: { select: { categoryId: true } },
        },
      },
    },
  });

  const skillIds = profile?.skills.map((s) => s.skillId) ?? [];

  const categoryIdsFromSkills =
    profile?.skills
      .map((s) => s.skill.categoryId)
      .filter((a): a is string => Boolean(a)) ?? [];

  // 2) Get categories from user-applied jobs
  const applications = await prisma.application.findMany({
    where: { applicantId: userId },
    select: {
      jobId: true,
      job: { select: { categoryId: true } },
    },
  });

  const appliedJobIds = applications.map((a) => a.jobId);

  const categoryIdsFromApplied = applications
    .map((a) => a.job.categoryId)
    .filter((a): a is string => Boolean(a));

  // Merge category preferences
  const preferredCategoryIds = Array.from(
    new Set([...categoryIdsFromSkills, ...categoryIdsFromApplied]),
  );

  const ors: Prisma.JobWhereInput[] = [];

  if (skillIds.length > 0) {
    ors.push({
      skills: {
        some: {
          skillTagId: { in: skillIds },
        },
      },
    });
  }

  if (preferredCategoryIds.length > 0) {
    ors.push({ categoryId: { in: preferredCategoryIds } });
  }

  const ands: Prisma.JobWhereInput[] = [base];

  if (ors.length > 0) ands.push({ OR: ors });

  if (appliedJobIds.length > 0) {
    ands.push({
      id: { notIn: appliedJobIds },
    });
  }

  return ands.length === 1 ? ands[0] : { AND: ands };
}

/**
 * Cursor-based pagination + recommendation-aware fetch
 */
export async function getRecommendedJobsPage({
  userId,
  cursor,
  limit = 10,
}: {
  userId: string | null;
  cursor?: string | null;
  limit?: number;
}) {
  const where = await buildRecommendedJobWhere(userId);

  let items = await prisma.job.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      manpower: true,
      salary: true,
      company: true,
      location: true,
      status: true,
      createdAt: true,
      deletedAt: true,
      categoryId: true,
      category: { select: { name: true } },
      skills: { select: { skillTag: { select: { id: true, name: true } } } },
    },
  });

  // Handle next cursor
  let nextCursor: string | null = null;
  if (items.length > limit) {
    nextCursor = items[limit].id;
    items = items.slice(0, limit);
  }

  return {
    jobs: items,
    nextCursor,
  };
}
