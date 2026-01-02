"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toTitleCase } from "@/lib/utils";
import { MapPin, Users, Tag, Banknote } from "lucide-react";
import ApplyJobDialog from "./apply-job-dialog";
import { SessionProvider } from "next-auth/react";

export default function JobDetailsPanel({
  job,
  skills,
}: {
  job: {
    id: string;
    title: string;
    description: string;
    manpower: number;
    salary: number;
    company: string;
    location: string;
    status: string;
    createdAt: Date;
    category?: { name?: string };
  };
  skills: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <SessionProvider>
      <Card className="flex w-2/3 flex-col bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
        <ScrollArea className="h-full p-6">
          <CardHeader>
            <h2 className="m-0 border-none p-0 text-gray-900 dark:text-gray-100">{job.title}</h2>
            <h4 className="m-0 p-0 text-gray-500 dark:text-gray-400">{job.company}</h4>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="size-4" />
                <span>{job.location}</span>
              </p>
              {job.category?.name && (
                <p className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Tag className="size-4" />
                  <span>{toTitleCase(job.category.name)}</span>
                </p>
              )}
              <p className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Banknote className="size-4" />
                <span>₱ {job.salary.toLocaleString()}</span>
              </p>
              <p className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Users className="size-4" />
                <span>{job.manpower} slots available</span>
              </p>
            </div>

            {skills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-gray-900 dark:text-gray-100">
                  Skills Requirements
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="font-normal text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-700"
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-gray-900 dark:text-gray-100">
                Job Description
              </p>
              <p className="w-full whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                {job.description}
              </p>
            </div>
          </CardContent>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        <CardFooter className="flex shrink-0 justify-end gap-3 border-t border-gray-200 dark:border-slate-800 p-4">
          <Button variant="ghost" className="text-gray-900 dark:text-gray-100">Save</Button>
          <Button
            onClick={() => setOpen(true)}
            className="bg-lime-500 text-white dark:bg-lime-500 dark:text-white"
          >
            Quick Apply
          </Button>
        </CardFooter>

        <ApplyJobDialog jobId={job.id} open={open} onOpenChange={setOpen} />
      </Card>
    </SessionProvider>
  );
}
