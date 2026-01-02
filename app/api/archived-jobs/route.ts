// app/api/archived-jobs/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0; // no caching, always fresh

import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/http";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { Prisma } from "@prisma/client";

const SORTABLE = ["title", "salary", "applications", "createdAt"] as const;
type SortBy = (typeof SORTABLE)[number];
type SortDir = "asc" | "desc";

function readSort(url: URL): { sortBy: SortBy; sortDir: SortDir } {
  const rawBy = (url.searchParams.get("sortBy") || "createdAt") as SortBy;
  const sortBy: SortBy = (SORTABLE as readonly string[]).includes(rawBy)
    ? rawBy
    : "createdAt";

  let sortDir = (url.searchParams.get("sortDir") || "desc") as SortDir;
  if (sortDir !== "asc" && sortDir !== "desc") sortDir = "desc";

  // default ascending for non-createdAt sorts
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
        ? statusParam
        : null;

    const { sortBy, sortDir } = readSort(url);
    const { limit, page, skip } = readOffsetParams(url);

    // 🔹 base: archived only
    const where: Prisma.JobWhereInput = {
      deletedAt: { not: null },
    };

    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    if (q && q.trim().length > 0) {
      const trimmed = q.trim();
      where.OR = [
        { title: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { company: { contains: trimmed, mode: "insensitive" } },
        { location: { contains: trimmed, mode: "insensitive" } },
      ];
    }

    // 🔹 build orderBy safely
    const orderBy: Prisma.JobOrderByWithRelationInput[] = [];

    if (sortBy === "applications") {
      // ✅ correct syntax: relation name -> _count
      orderBy.push({
        applications: {
          _count: sortDir,
        },
      });
      orderBy.push({ createdAt: "desc" });
    } else if (sortBy === "title" || sortBy === "salary") {
      orderBy.push({ [sortBy]: sortDir } as Prisma.JobOrderByWithRelationInput);
      orderBy.push({ id: "asc" });
    } else {
      orderBy.push({ createdAt: sortDir });
      orderBy.push({ id: sortDir });
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        take: limit,
        skip,
        orderBy,
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
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const mapped = items.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      manpower: j.manpower,
      salary: j.salary,
      company: j.company,
      location: j.location,
      status: j.status,
      createdAt: j.createdAt.toISOString(),
      categoryId: j.categoryId,
      category: j.category,
      applicantsCount: j._count.applications,
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasMore = page < totalPages;

    return ok(mapped, {
      limit,
      sortBy,
      sortDir,
      paging: {
        mode: "offset" as const,
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
