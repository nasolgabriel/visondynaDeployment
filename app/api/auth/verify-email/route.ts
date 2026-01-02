import crypto from "crypto";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

  prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { tokenHash } }),
  ]);

  return NextResponse.json({ ok: true, data: null }, { status: 200 });
}
