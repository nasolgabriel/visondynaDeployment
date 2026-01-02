import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import VerificationEmail from "@/components/email/verification-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const {
      firstname,
      lastname,
      email,
      role,
      birthDate,
      gender,
      password,
      confirmPassword,
    } = await req.json();
    const isEmail = z.email().parse(email);

    if (!isEmail)
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "The email provided is invalid",
          },
          meta: { requestId: "…" },
        },
        { status: 409 },
      );

    if (password !== confirmPassword)
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Password does not match, please confirm your password",
          },
        },
        { status: 409 },
      );

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser)
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "This user already exists",
          },
          meta: { requestId: "…" },
        },
        { status: 409 },
      );

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        role,
        birthDate,
        gender,
        password: hashedPassword,
      },
    });

    await prisma.profile.create({
      data: {
        user: {
          connect: { id: newUser.id },
        },
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.emailVerificationToken.create({
      data: { userId: newUser.id, tokenHash, expires },
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Verify your email at Visondyna",
      react: VerificationEmail({
        verifyUrl,
        userName: `${firstname} ${lastname}`,
      }),
    });

    if (error) {
      // await prisma.user.delete({ where: { id: newUser.id } });
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: newUser }, { status: 201 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: err });
  }
}
