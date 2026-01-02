import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const payloadSchema = z.object({
  skillIds: z.array(z.string().min(1)).min(0),
});

async function getProfileId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  const p = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return p?.id ?? null;
}

export async function GET() {
  try {
    const profileId = await getProfileId();
    if (!profileId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const selected = await prisma.applicantSkillTag.findMany({
      where: { profileId },
      select: { skillId: true },
    });

    return NextResponse.json({
      ok: true,
      data: selected.map((s) => s.skillId),
    });
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
    const profileId = await getProfileId();
    if (!profileId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const json = await req.json();
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { skillIds } = parsed.data;

    await prisma.$transaction([
      prisma.applicantSkillTag.deleteMany({ where: { profileId } }),
      ...(skillIds.length
        ? [
            prisma.applicantSkillTag.createMany({
              data: skillIds.map((skillId) => ({ profileId, skillId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
