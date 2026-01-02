// app/api/applications/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { ok, notFound, badRequest, serverError } from "@/lib/http";
import { updateApplicationStatusSchema } from "@/lib/schemas/applications";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const a = await prisma.application.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        formData: true,
        submittedAt: true,
        job: {
          select: { id: true, title: true, company: true, location: true },
        },
        applicant: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
    });
    if (!a) return notFound("Application not found");

    return ok({
      id: a.id,
      status: a.status,
      submittedAt: a.submittedAt.toISOString(),
      formData: a.formData,
      job: a.job,
      applicant: {
        id: a.applicant.id,
        name: `${a.applicant.firstname} ${a.applicant.lastname}`,
        email: a.applicant.email,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const json = await req.json();
    const parsed = updateApplicationStatusSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    // Update application status and select applicantId + job info
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      select: {
        id: true,
        status: true,
        applicantId: true, // Needed for notification
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
          },
        },
      },
    });

    // Create notification for applicant
    await prisma.notification.create({
      data: {
        userId: updated.applicantId,
        message: `Your application for ${updated.job.title} at ${updated.job.company} has been updated to ${parsed.data.status}`,
        type: parsed.data.status, // ApplicationStatus enum
        company: updated.job.company,
        jobTitle: updated.job.title,
        location: updated.job.location,
        status: "UNREAD", // notification status
      },
    });

    // Return updated application status
    return ok({
      id: updated.id,
      status: updated.status,
    });
  } catch (err) {
    return serverError(err);
  }
}
