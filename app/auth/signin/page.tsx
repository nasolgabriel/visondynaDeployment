import { authOptions } from "@/lib/auth";
import SignInForm from "@/components/auth/signin-form";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visondyna / Sign In",
  description: "",
};
export default async function SignIn() {
  const session = await getServerSession(authOptions);

  if (session) {
    const role = session?.user.role;

    const url = {
      ADMIN: "/admin/dashboard",
      HR: "/hr/dashboard",
      APPLICANT: "/feed",
    };

    redirect(url[role]);
  }

  return <SignInForm />;
}
