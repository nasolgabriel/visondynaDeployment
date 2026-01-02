// app/api/applications/route.ts
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { ok, serverError, readPaginationParams } from "@/lib/http";
import type { Prisma } from "@prisma/client";

const SORTABLE = [
  "applicant",
  "email",
  "jobTitle",
  "status",
  "submittedAt",
] as const;
type SortBy = (typeof SORTABLE)[number];
type SortDir = "asc" | "desc";

function readSort(url: URL): { sortBy: SortBy; sortDir: SortDir } {
  const raw = (url.searchParams.get("sortBy") || "submittedAt") as SortBy;
  const sortBy: SortBy = (SORTABLE as readonly string[]).includes(raw)
    ? raw
    : "submittedAt";
  let sortDir = (url.searchParams.get("sortDir") || "desc") as SortDir;
  if (!["asc", "desc"].includes(sortDir)) sortDir = "desc";
  if (!url.searchParams.has("sortDir") && sortBy !== "submittedAt")
    sortDir = "asc";
  return { sortBy, sortDir };
}

function readOffset(url: URL) {
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
    const jobId = url.searchParams.get("jobId") || undefined;
    const statusParam = url.searchParams.get("status") || undefined;

    const status = statusParam as
      | "SUBMITTED"
      | "UNDER_REVIEW"
      | "SHORTLISTED"
      | "INTERVIEWED"
      | "OFFERED"
      | "HIRED"
      | "REJECTED"
      | undefined;

    const where: Prisma.ApplicationWhereInput = { deletedAt: null };
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;

    if (q) {
      // search applicant name/email or job title
      where.OR = [
        { applicant: { firstname: { contains: q, mode: "insensitive" } } },
        { applicant: { lastname: { contains: q, mode: "insensitive" } } },
        { applicant: { email: { contains: q, mode: "insensitive" } } },
        { job: { title: { contains: q, mode: "insensitive" } } },
        { job: { company: { contains: q, mode: "insensitive" } } },
      ];
    }

    const { sortBy, sortDir } = readSort(url);

    // cursor pagination for submittedAt
    if (sortBy === "submittedAt") {
      const { limit, cursor } = readPaginationParams(url);
      let items = await prisma.application.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [{ submittedAt: sortDir }, { id: sortDir }],
        select: {
          id: true,
          status: true,
          submittedAt: true,
          job: {
            select: { id: true, title: true, company: true, location: true },
          },
          applicant: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      });

      let nextCursor: string | null = null;
      if (items.length > limit) {
        nextCursor = items[limit].id;
        items = items.slice(0, limit);
      }

      return ok(
        items.map((a) => ({
          id: a.id,
          status: a.status,
          submittedAt: a.submittedAt.toISOString(),
          job: a.job,
          applicant: {
            id: a.applicant.id,
            name: `${a.applicant.firstname} ${a.applicant.lastname}`,
            email: a.applicant.email,
          },
        })),
        {
          limit,
          sortBy,
          sortDir,
          paging: { mode: "cursor", nextCursor },
        },
      );
    }

    // offset pagination for everything else
    const { limit, page, skip } = readOffset(url);

    const orderBy: Prisma.ApplicationOrderByWithRelationInput[] = (() => {
      switch (sortBy) {
        case "applicant":
          return [
            { applicant: { lastname: sortDir } },
            { applicant: { firstname: sortDir } },
            { id: "asc" },
          ];
        case "email":
          return [{ applicant: { email: sortDir } }, { id: "asc" }];
        case "jobTitle":
          return [{ job: { title: sortDir } }, { id: "asc" }];
        case "status":
          return [{ status: sortDir }, { id: "asc" }];
        default:
          return [{ submittedAt: "desc" }, { id: "desc" }];
      }
    })();

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        take: limit,
        skip,
        orderBy,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          job: {
            select: { id: true, title: true, company: true, location: true },
          },
          applicant: {
            select: { id: true, firstname: true, lastname: true, email: true },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return ok(
      items.map((a) => ({
        id: a.id,
        status: a.status,
        submittedAt: a.submittedAt.toISOString(),
        job: a.job,
        applicant: {
          id: a.applicant.id,
          name: `${a.applicant.firstname} ${a.applicant.lastname}`,
          email: a.applicant.email,
        },
      })),
      {
        limit,
        sortBy,
        sortDir,
        paging: {
          mode: "offset",
          page,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    );
  } catch (err) {
    return serverError(err);
  }
}
