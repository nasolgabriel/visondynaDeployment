"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Job } from "@/lib/types";
import { Building2, Tag } from "lucide-react";
import { toTitleCase } from "@/lib/utils";

type JobWithSkills = Job & {
  skills: { skillTag: { id: string; name: string } }[];
};

type JobUI = Omit<JobWithSkills, "createdAt"> & { createdAt: Date };

export default function JobCard({ job }: { job: JobUI }) {
  return (
    <div>
      <Link href={`/jobs/${job.id}`}>
        <Card className="cursor-pointer dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-xl text-lime-500">{job.title}</CardTitle>
            <CardDescription className="text-base font-medium">
              {job.company}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="inline-flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-4" />
                <CardDescription>{job.location}</CardDescription>
              </div>
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Tag className="size-4" />
                <CardDescription>
                  {toTitleCase(job.category?.name || "")}
                </CardDescription>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="inline-flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge variant="outline" key={skill.skillTag.id}>
                  {skill.skillTag.name}
                </Badge>
              ))}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
