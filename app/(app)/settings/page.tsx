// app/(app)/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AccountForm from "@/components/settings/account-form";
import ProfileForm from "@/components/settings/profile-form";
import PasswordForm from "@/components/settings/password-form";

export default async function Settings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstname: true,
      lastname: true,
      gender: true,
      birthDate: true,
      email: true,
    },
  });

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      profession: true,
      phone: true,
      profileSummary: true,
    },
  });

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <Card className="dark:bg-slate-950">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Update your basic account information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm
            initial={{
              firstname: user!.firstname,
              lastname: user!.lastname,
              email: user!.email,
              birthDateISO: user!.birthDate?.toISOString().slice(0, 10), // "YYYY-MM-DD"
              gender: user!.gender, // "male" | "female"
            }}
          />
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-950">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>What people see on your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              profession: profile?.profession ?? "",
              phone: profile?.phone ?? "",
              profileSummary: profile?.profileSummary ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-950">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
