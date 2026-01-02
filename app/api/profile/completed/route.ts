import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getProfileIdOrFail } from "@/lib/auth/profile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    const profileId = await getProfileIdOrFail();
    if (!profileId)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    await prisma.profile.update({
      where: { id: profileId },
      data: { profileCompleted: true },
    });

    // Get the signed-in user's id so we can set a user-specific cookie.
    // Middleware checks the cookie value against the authenticated user's id (token.sub).
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const res = NextResponse.json({ ok: true }, { status: 200 });

    if (userId) {
      // store user id (not profile id) so the cookie only applies to that user
      res.cookies.set("vd_profileCompleted", String(userId), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        // 1 day is fine; adjust if you want session-only behavior
        maxAge: 60 * 60 * 24,
      });
    }

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
