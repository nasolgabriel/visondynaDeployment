// app/feed/page.tsx
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, Settings } from "lucide-react";
import FeedList from "@/components/feed-list";
import { getRecommendedJobsPage } from "@/lib/job-recommendation"; // 👈 NEW

const PAGE_SIZE = 10;

export default async function Feed() {
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id ?? null;
  const applicationsCount = userId
    ? await prisma.application.count({
        where: { applicantId: userId },
      })
    : 0;

  const { jobs: first, nextCursor } = await getRecommendedJobsPage({
    userId,
    limit: PAGE_SIZE,
  });

  return (
    <div className="mx-auto flex w-3/4 flex-row gap-6">
      <div className="sticky top-0 w-3/12 flex-none space-y-6 self-start">
        <Card>
          <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" />
              <AvatarFallback>{session?.user.name?.at(0)}</AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold">{session?.user.name}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Profile strength</span>
                <span>{50}%</span>
              </div>
              <Progress value={50} className="h-1" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-900">
                <span className="text-xs text-slate-400">Applications</span>
                <span className="text-xs">{applicationsCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-900">
                <span className="text-xs text-slate-400">Saved</span>
                <span className="text-xs">10</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-900">
                <span className="text-xs text-slate-400">Alerts</span>
                <span className="text-xs">4</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="w-full text-xs dark:hover:bg-slate-900"
              asChild
            >
              <Link href={`/profile/`}>
                <User size={14} />
                <span>View Profile</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full text-xs dark:hover:bg-slate-900"
              asChild
            >
              <Link href="/settings">
                <Settings size={14} />
                <span>Settings</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="min-w-0 flex-1">
        {/* FeedList API contract stays the same */}
        <FeedList initialItems={first} initialCursor={nextCursor} />
      </div>

        
    </div>
  );
}
