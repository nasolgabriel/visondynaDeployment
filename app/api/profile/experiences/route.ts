import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getProfileIdOrFail } from "@/lib/auth/profile";
import { zDateISO } from "@/lib/schemas/shared";

const createExperienceSchema = z.object({
  job: z.string().min(2),
  company: z.string().min(1),
  startDate: zDateISO,
  lastAttended: zDateISO.optional(),
});

export async function GET() {
  try {
    const profileId = await getProfileIdOrFail();
    if (!profileId)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const list = await prisma.experience.findMany({
      where: { profileId },
      orderBy: { startDate: "desc" },
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
    const parsed = createExperienceSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { job, company, startDate, lastAttended } = parsed.data;

    const created = await prisma.experience.create({
      data: {
        job,
        company,
        startDate: new Date(startDate),
        lastAttended: lastAttended ? new Date(lastAttended) : undefined, // if non-nullable, use new Date(startDate)
        profileId,
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
