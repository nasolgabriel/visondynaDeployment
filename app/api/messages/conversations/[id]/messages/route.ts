import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfileIdOrFail } from "@/lib/auth/profile";

type SessionUser = { id?: string; role?: "ADMIN" | "APPLICANT" | string };
type ApiMessageCreate = { content?: string };

type Params = { params: { id: string } };

/**
 * GET: list messages for conversation :id
 * POST: append a message to conversation :id
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const convo = await prisma.conversation.findUnique({
      where: { id: params.id },
    });
    if (!convo)
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 },
      );

    const role = (session.user as SessionUser).role ?? "";
    if (role !== "HR") {
      const profileId = await getProfileIdOrFail();
      if (!profileId || convo.applicantProfileId !== profileId)
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 },
        );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ok: true, data: messages });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const convo = await prisma.conversation.findUnique({
      where: { id: params.id },
    });
    if (!convo)
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 },
      );

    const role = (session.user as SessionUser).role ?? "";
    if (role !== "HR") {
      const profileId = await getProfileIdOrFail();
      if (!profileId || convo.applicantProfileId !== profileId)
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 },
        );
    }

    const body = (await req.json()) as ApiMessageCreate;
    const content = (body.content || "").toString().trim();
    if (!content)
      return NextResponse.json(
        { ok: false, error: "Invalid content" },
        { status: 400 },
      );

    const senderRole = role === "HR" ? "HR" : "APPLICANT";
    const created = await prisma.message.create({
      data: {
        conversationId: params.id,
        content,
        senderRole,
        senderUserId: session.user.id,
      },
    });

    // update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: created.createdAt },
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
