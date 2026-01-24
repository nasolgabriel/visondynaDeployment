import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatDistanceToNowStrict } from "date-fns";
import JobDetailsPanel from "@/components/job-details-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Banknote, MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { title: true, company: true },
  });
  if (!job) return { title: "Job not found · Visondyna" };
  return { title: `${job.title} at ${job.company} · Visondyna` };
}

export default async function JobDetailPage({ params }: PageProps) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      manpower: true,
      salary: true,
      company: true,
      location: true,
      status: true,
      createdAt: true,
      category: { select: { id: true, name: true } },
      skills: { select: { skillTag: { select: { id: true, name: true } } } },
      categoryId: true,
    },
  });

  if (!job) notFound();

  const related = await prisma.job.findMany({
    where: { categoryId: job.categoryId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      createdAt: true,
      salary: true,
      description: true,
    },
  });

  const dedup = new Map<string, (typeof related)[number]>();
  dedup.set(job.id, {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    createdAt: job.createdAt,
    salary: job.salary,
    description: job.description,
  });
  for (const r of related) dedup.set(r.id, r);
  const list = Array.from(dedup.values());

  const skills = job.skills.map((s) => s.skillTag);

  return (
    <div className="h-full overflow-hidden">
      <div className="mx-auto flex h-full w-3/4 gap-6">
        <div className="flex min-h-0 w-5/12 flex-col border-r border-slate-800 px-6">
          <h4 className="mb-4 text-white">Jobs you may like</h4>

          <ScrollArea className="h-full px-4">
            <div className="space-y-4">
              {list.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No related jobs yet.
                </div>
              ) : (
                list.map((r) => {
                  const isCurrent = r.id === job.id;

                  return (
                    <div key={r.id}>
                      <Link href={`/jobs/${r.id}`}>
                        <Card
                          className={`bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 ${
                            isCurrent ? "border-2 border-lime-500" : ""
                          }`}
                        >
                          <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100">{r.title}</CardTitle>
                            <CardTitle className="text-gray-500 dark:text-gray-400">
                              {r.company}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="flex flex-col space-y-2">
                            <CardDescription className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <MapPin className="size-4" />
                              <span>{r.location}</span>
                            </CardDescription>

                            <CardDescription className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Banknote className="size-4" />
                              <span>₱ {r.salary.toLocaleString()}</span>
                            </CardDescription>

                            <CardDescription className="mt-2 line-clamp-2 text-gray-600 dark:text-gray-400">
                              {r.description}
                            </CardDescription>
                          </CardContent>

                          <CardFooter>
                            <CardDescription className="text-gray-500 dark:text-gray-400">
                              {formatDistanceToNowStrict(r.createdAt, { addSuffix: true })}
                            </CardDescription>
                          </CardFooter>
                        </Card>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>

        <JobDetailsPanel job={job} skills={skills} />
      </div>
    </div>
  );
}
