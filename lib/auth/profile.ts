import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

export async function getProfileIdOrFail() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  const p = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return p?.id ?? null;
}
