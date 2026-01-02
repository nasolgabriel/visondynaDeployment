"use client";

import { Banknote, MapPin, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Link from "next/link";
import { toTitleCase } from "@/lib/utils";

type Job = {
  id: string;
  title: string;
  location: string;
  description: string;
  status: string;
  company: string;
  manpower: number;
  salary: number;
  skills: { skillTag: { id: string; name: string } }[];
};

export default function HomeCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{job.title}</CardTitle>
          <CardTitle className="text-muted-foreground">{job.company}</CardTitle>
          <div className="py-2">
            <Badge className="bg-lime-500 text-white">
              {toTitleCase(job.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <p className="inline-flex w-full items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span>{job.location}</span>
          </p>
          <p className="inline-flex w-full items-center gap-2 text-sm text-muted-foreground">
            <Banknote className="size-4" />
            <span>₱ {job.salary.toLocaleString()}</span>
          </p>
          <p className="inline-flex w-full items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>{job.manpower} slots available</span>
          </p>
        </CardContent>
        <CardFooter>
          <div className="inline-flex flex-wrap items-center gap-2">
            {job.skills.map((skill) => (
              <Badge variant="outline" className="" key={skill.skillTag.id}>
                {skill.skillTag.name}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
