import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfileIdOrFail } from "@/lib/auth/profile";

type SessionUser = { id?: string; role?: "ADMIN" | "APPLICANT" | string };

/**
 * GET: list conversations (admin -> all, applicant -> only theirs)
 * POST: create conversation (applicant creates for self; admin may create for applicantProfileId)
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const role = (session.user as SessionUser).role ?? "";

    if (role === "HR") {
      const convos = await prisma.conversation.findMany({
        orderBy: { lastMessageAt: "desc" },
        include: {
          applicant: {
            select: {
              id: true,
              user: {
                select: { firstname: true, lastname: true, email: true },
              },
            },
          },
          _count: { select: { messages: true } },
        },
      });
      return NextResponse.json({ ok: true, data: convos });
    } else {
      const profileId = await getProfileIdOrFail();
      if (!profileId)
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 },
        );

      const convos = await prisma.conversation.findMany({
        where: { applicantProfileId: profileId },
        orderBy: { lastMessageAt: "desc" },
        include: { _count: { select: { messages: true } } },
      });
      return NextResponse.json({ ok: true, data: convos });
    }
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const role = (session.user as SessionUser).role ?? "";
    const json = await req.json();
    const { subject, initialMessage, applicantProfileId } = json as {
      subject?: string;
      initialMessage?: string;
      applicantProfileId?: string;
    };

    if (role !== "HR") {
      // Applicant creates for themself
      const profileId = await getProfileIdOrFail();
      if (!profileId)
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 },
        );

      const convo = await prisma.conversation.create({
        data: {
          applicantProfileId: profileId,
          subject,
          lastMessageAt: initialMessage ? new Date() : undefined,
          messages: initialMessage
            ? {
                create: {
                  content: initialMessage.trim(),
                  senderRole: "APPLICANT",
                  senderUserId: session.user.id,
                },
              }
            : undefined,
        },
      });
      return NextResponse.json({ ok: true, data: convo }, { status: 201 });
    } else {
      // Admin creates for an applicant
      if (!applicantProfileId)
        return NextResponse.json(
          { ok: false, error: "applicantProfileId is required" },
          { status: 400 },
        );

      const convo = await prisma.conversation.create({
        data: {
          applicantProfileId,
          subject,
          lastMessageAt: initialMessage ? new Date() : undefined,
          messages: initialMessage
            ? {
                create: {
                  content: initialMessage.trim(),
                  senderRole: "ADMIN",
                  senderUserId: session.user.id,
                },
              }
            : undefined,
        },
      });
      return NextResponse.json({ ok: true, data: convo }, { status: 201 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
