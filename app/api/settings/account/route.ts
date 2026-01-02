// app/api/settings/account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(), // read only on UI, but kept for consistency
  birthDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  gender: z.union([z.literal("male"), z.literal("female")]),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { firstname, lastname, birthDate, gender } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstname,
      lastname,
      birthDate: new Date(birthDate),
      gender,
    },
  });

  return NextResponse.json({ ok: true });
}
