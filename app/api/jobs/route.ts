// app/api/jobs/route.ts
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import {
  ok,
  created,
  badRequest,
  conflict,
  serverError,
  readPaginationParams,
} from "@/lib/http";
import { createJobSchema } from "@/lib/schemas/jobs";
import { Prisma } from "@prisma/client";
import type { JobStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function buildJobWhere(
  q?: string | null,
  categoryId?: string | null,
  status?: JobStatus,
) {
  const trimmedQ = q?.trim();
  const trimmedCategoryId = categoryId?.trim();

  // base filter: exclude archived jobs
  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (trimmedCategoryId) where.categoryId = trimmedCategoryId;
  if (status) where.status = status;

  if (trimmedQ) {
    const searchConditions = [
      { title: { contains: trimmedQ, mode: "insensitive" as const } },
      { description: { contains: trimmedQ, mode: "insensitive" as const } },
      { company: { contains: trimmedQ, mode: "insensitive" as const } },
      { location: { contains: trimmedQ, mode: "insensitive" as const } },
    ];
    Object.assign(where, { OR: searchConditions });
  }

  return where;
}

const SORTABLE = [
  "title",
  "salary",
  "manpower",
  "applications",
  "createdAt",
] as const;
type SortBy = (typeof SORTABLE)[number];
type SortDir = "asc" | "desc";

function readSort(url: URL): { sortBy: SortBy; sortDir: SortDir } {
  const rawBy = (url.searchParams.get("sortBy") || "createdAt") as SortBy;
  const sortBy: SortBy = (SORTABLE as readonly string[]).includes(rawBy)
    ? rawBy
    : "createdAt";

  let sortDir = (url.searchParams.get("sortDir") || "desc") as SortDir;
  if (sortDir !== "asc" && sortDir !== "desc") sortDir = "desc";

  if (!url.searchParams.has("sortDir") && sortBy !== "createdAt") {
    sortDir = "asc";
  }
  return { sortBy, sortDir };
}

function readOffsetParams(url: URL) {
  const limit = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get("limit") || 10)),
  );
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const skip = (page - 1) * limit;
  return { limit, page, skip };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const q = url.searchParams.get("q") || undefined;
    const categoryId = url.searchParams.get("categoryId") || undefined;

    const statusParam = url.searchParams.get("status");
    const status =
      statusParam === "OPEN" ||
      statusParam === "CLOSED" ||
      statusParam === "FILLED"
        ? (statusParam as JobStatus)
        : undefined;

    const { sortBy, sortDir } = readSort(url);
    const where = buildJobWhere(q, categoryId, status);

    // cursor pagination for createdAt
    if (sortBy === "createdAt") {
      const { limit, cursor } = readPaginationParams(url);

      let items = await prisma.job.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: sortDir }, { id: sortDir }],
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
          categoryId: true,
          category: { select: { id: true, name: true } },
          skills: {
            select: { skillTag: { select: { id: true, name: true } } },
          },
          _count: {
            select: { applications: true },
          },
        },
      });

      let nextCursor: string | null = null;
      if (items.length > limit) {
        nextCursor = items[limit].id;
        items = items.slice(0, limit);
      }

      return ok(items, {
        nextCursor,
        limit,
        sortBy,
        sortDir,
        paging: { mode: "cursor", nextCursor },
      });
    }

    // offset pagination for other sorts
    const { limit, page, skip } = readOffsetParams(url);

    const orderByClause: Prisma.JobOrderByWithRelationInput[] =
      sortBy === "applications"
        ? [
            // sort by relation count
            { applications: { _count: sortDir } },
            { id: "asc" },
          ]
        : [
            // sort by scalar field
            { [sortBy]: sortDir } as Prisma.JobOrderByWithRelationInput,
            { id: "asc" },
          ];

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        take: limit,
        skip,
        orderBy: orderByClause,
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
          categoryId: true,
          category: { select: { id: true, name: true } },
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasMore = page < totalPages;

    return ok(items, {
      nextCursor: null,
      limit,
      sortBy,
      sortDir,
      paging: {
        mode: "offset",
        page,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      return serverError(err);
    }
    return serverError(err);
  }
}

type CreateJobPayload = {
  title: string;
  description: string;
  location: string;
  salary: number;
  manpower: number;
  company: string;
  categoryId: string;
  status?: JobStatus;
  skills?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    console.log(userId);

    if (!userId) return badRequest("Unauthorized");

    const body = (await req.json()) as unknown;
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid job payload", parsed.error.flatten());
    }

    const skills: string[] | undefined = Array.isArray(
      (body as Partial<CreateJobPayload>).skills,
    )
      ? ((body as Partial<CreateJobPayload>).skills as string[])
      : undefined;

    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true },
    });
    if (!category) return badRequest("Invalid categoryId");

    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          ...parsed.data,
          postedById: userId,
        },
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
          categoryId: true,
        },
      });

      if (skills && skills.length > 0) {
        const validSkills = await tx.skillTag.findMany({
          where: { id: { in: skills } },
          select: { id: true },
        });
        if (validSkills.length !== skills.length) {
          throw new Error("One or more skill ids are invalid.");
        }

        await tx.jobSkillTag.createMany({
          data: validSkills.map((s) => ({ jobId: job.id, skillTagId: s.id })),
          skipDuplicates: true,
        });
      }

      return job;
    });

    return created(result);
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return conflict("Unique constraint violation", err.meta);
      }
      return serverError(err);
    }
    return serverError(err);
  }
}
