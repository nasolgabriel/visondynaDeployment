import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { ok, notFound, badRequest, serverError } from "@/lib/http";
import { updateJobSchema } from "@/lib/schemas/jobs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
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
        category: { select: { id: true, name: true } },
        // include related skills
        skills: {
          select: {
            skillTag: { select: { id: true, name: true } },
          },
        },
        // include applications and applicant details
        applications: {
          select: {
            id: true,
            status: true,
            formData: true,
            submittedAt: true,
            applicant: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!job) return notFound("Job not found");

    const result = {
      id: job.id,
      title: job.title,
      description: job.description,
      manpower: job.manpower,
      salary: job.salary,
      company: job.company,
      location: job.location,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      category: job.category,
      skills: job.skills.map((s) => ({
        id: s.skillTag.id,
        name: s.skillTag.name,
      })),
      applications: job.applications.map((a) => ({
        id: a.applicant.id,
        name: `${a.applicant.firstname} ${a.applicant.lastname}`,
        email: a.applicant.email,
        formData: a.formData,
        status: a.status,
        submittedAt: a.submittedAt.toISOString(),
      })),
    };

    return ok(result);
  } catch (err: unknown) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const json = await req.json();
    const parsed = updateJobSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid job payload", parsed.error.flatten());
    }

    if (parsed.data.categoryId) {
      const exists = await prisma.category.findUnique({
        where: { id: parsed.data.categoryId },
        select: { id: true },
      });
      if (!exists) return badRequest("Invalid categoryId");
    }

    const updated = await prisma.job.update({
      where: { id: params.id },
      data: parsed.data,
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

    return ok(updated);
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2025") return notFound("Job not found");
    }
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.job.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2025") return notFound("Job not found");
    }
    return serverError(err);
  }
}
