// app/(app)/profile/page.tsx
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EditProfileDialog from "@/components/profile/edit-profile-dialog";
import ManageSkills from "@/components/profile/manage-skills";
import ManageExperiences from "@/components/profile/manage-experiences";
import ManageEducations from "@/components/profile/manage-educations";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ApplicantProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id as string;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      education: { orderBy: { enrolledDate: "desc" } },
      experience: { orderBy: { startDate: "desc" } },
      skills: {
        include: {
          skill: { select: { id: true, name: true, categoryId: true } },
        },
      },
      user: { select: { firstname: true, lastname: true, email: true } },
    },
  });

  if (!profile) notFound();

  const fullName = `${profile.user.firstname} ${profile.user.lastname}`;

  return (
    <div className="mx-auto h-full w-full max-w-4xl space-y-6">
      <Card className="overflow-hidden dark:bg-slate-900">
        <div className="relative h-44 w-full">
          <Image
            src="https://images.unsplash.com/photo-1619070849223-c02f450670ed?q=80&w=1170&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>

        <CardContent className="pt-12">
          <div className="relative -mt-16 mb-4 flex items-end gap-4">
            <Avatar className="h-28 w-28 ring-4 ring-white dark:ring-slate-900">
              <AvatarImage
                src={
                  session.user.image
                    ? session.user.image
                    : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                }
              />
              <AvatarFallback className="text-3xl">
                {profile.user.firstname[0]}
                {profile.user.lastname[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <CardTitle className="text-2xl">{fullName}</CardTitle>
              <CardDescription className="mt-1">
                {profile.profession || "—"}
              </CardDescription>
              <CardDescription className="text-slate-400">
                {profile.phone || "No phone"} · {profile.user.email}
              </CardDescription>
            </div>

            <EditProfileDialog
              initial={{
                profession: profile.profession || "",
                phone: profile.phone || "",
                profileSummary: profile.profileSummary || "",
                profileCompleted: Boolean(profile.profileCompleted),
              }}
            />
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold">About</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-300">
              {profile.profileSummary ||
                "Add a short summary to let employers know you better."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Skills you’ve selected.</CardDescription>
          </div>
          <ManageSkills />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profile.skills.length === 0 ? (
            <span className="text-sm text-slate-400">No skills yet.</span>
          ) : (
            profile.skills.map((st) => (
              <span
                key={st.skillId}
                className="rounded-full border px-3 py-1 text-sm text-slate-300 dark:border-slate-700 dark:bg-slate-800/60"
              >
                {st.skill.name}
              </span>
            ))
          )}
        </CardContent>
      </Card>

      <ManageExperiences initial={profile.experience} />

      <ManageEducations initial={profile.education} />
    </div>
  );
}
