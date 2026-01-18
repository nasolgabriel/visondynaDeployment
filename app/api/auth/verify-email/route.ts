import crypto from "crypto";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expires < new Date())
      return NextResponse.json(
        {
          ok: false,
          error: "BAD_REQUEST",
          message: "Token is invalid or expired",
        },
        { status: 400 },
      );

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.delete({ where: { tokenHash } }),
    ]);

    return NextResponse.json({ ok: true, data: null }, { status: 200 });
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Unable to verify email at this time.",
      },
      { status: 500 },
    );
  }
}
