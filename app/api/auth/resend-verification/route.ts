// /app/api/auth/resend-verification/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import VerificationEmail from "@/components/email/verification-email";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 },
      );
    }

    // Fetch user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if the email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { ok: false, error: "Email already verified" },
        { status: 400 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expires },
    });

    // Send email with the verification link using Resend
    const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: user.email,
      subject: "Verify your email at Visondyna",
      react: VerificationEmail({
        verifyUrl,
        userName: `${user.firstname} ${user.lastname}`,
      }),
    });

    if (error) return NextResponse.json({ ok: false, error }, { status: 400 });

    return NextResponse.json({ ok: true, message: "Verification email sent" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Server error, please try again" },
      { status: 500 },
    );
  }
}
