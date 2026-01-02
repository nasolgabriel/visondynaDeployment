import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { ok, created, badRequest, conflict, serverError } from "@/lib/http";
import { createCategorySchema } from "@/lib/schemas/categories";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const withSkills = url.searchParams.get("withSkills") === "1";

    if (withSkills) {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          skills: {
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          },
          _count: { select: { skills: true, jobs: true } },
        },
      });
      return ok(categories);
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { skills: true, jobs: true } },
      },
    });

    return ok(categories);
  } catch (err: unknown) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createCategorySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid category payload", parsed.error.flatten());
    }

    const category = await prisma.category.create({
      data: { name: parsed.data.name.trim() },
      select: { id: true, name: true },
    });

    return created(category);
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") return conflict("Category name must be unique");
    }
    return serverError(err);
  }
}
