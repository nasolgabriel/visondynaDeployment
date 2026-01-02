import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getProfileIdOrFail } from "@/lib/auth/profile";
import { zDateISO } from "@/lib/schemas/shared";

const createEducationSchema = z.object({
  course: z.string().min(2),
  institution: z.string().min(2),
  graduated: z.boolean(),
  enrolledDate: zDateISO,
  graduationDate: zDateISO.optional(), // if you keep non-nullable in Prisma, you'll force-fill below
});

export async function GET() {
  try {
    const profileId = await getProfileIdOrFail();
    if (!profileId)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const list = await prisma.education.findMany({
      where: { applicantProfileId: profileId },
      orderBy: { enrolledDate: "desc" },
    });

    return NextResponse.json({ ok: true, data: list });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const profileId = await getProfileIdOrFail();
    if (!profileId)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const json = await req.json();
    const parsed = createEducationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { course, graduated, institution, enrolledDate, graduationDate } =
      parsed.data;

    // If your Prisma schema is expecting graduationDate, handle it like this
    const grad = graduationDate || (graduated ? enrolledDate : null);

    const created = await prisma.education.create({
      data: {
        course,
        institution,
        graduated,
        enrolledDate: enrolledDate ? new Date(enrolledDate) : null,
        graduationDate: grad ? new Date(grad) : null,
        applicantProfileId: profileId,
      },
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
