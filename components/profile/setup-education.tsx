"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { CalendarIcon, GraduationCap, University, X } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CarouselApi } from "../ui/carousel";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

type Edu = {
  id: string;
  course: string;
  institution: string;
  graduated: boolean;
  enrolledDate: Date;
  graduationDate: Date;
};

export default function SetupEducation({
  onDone,
  api,
}: {
  onDone?: () => void;
  api?: CarouselApi;
}) {
  const [items, setItems] = useState<Edu[]>([]);

  const [course, setCourse] = useState("");
  const [institution, setInstitution] = useState("");
  const [enrolledDate, setEnrolledDate] = useState<Date>();
  const [graduationDate, setGraduationDate] = useState<Date>();
  const [graduated, setGraduated] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log(items);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("/api/profile/educations");
        const json = await res.json();
        if (!cancel && json?.ok) setItems(json.data);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function add() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/educations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          course,
          graduated,
          institution,
          enrolledDate,
          graduationDate,
        }),
      });

      const json = await res.json();
      if (res.ok && json?.ok) {
        setItems((prev) => [json.data, ...prev]);
      } else {
        console.error(json);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/profile/educations/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="w-full font-medium">Tell Us About Your Education</p>
        <p className="w-full text-sm text-muted-foreground">
          Add your educational background, including programs, schools, and
          dates attended. This helps us better understand your qualifications.
        </p>
      </div>
      <div className="space-y-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Course or Program"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
          <InputGroupAddon>
            <GraduationCap className="size-4" />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            placeholder="School or University"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
          <InputGroupAddon>
            <University className="size-4" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex items-center gap-2">
          <Checkbox
            id="graduated"
            checked={graduated}
            onCheckedChange={(v) => setGraduated(Boolean(v))}
          />
          <label htmlFor="graduated" className="text-sm">
            Qualifications completed
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !enrolledDate && "text-muted-foreground",
                )}
              >
                {enrolledDate ? (
                  format(enrolledDate, "MMMM d, yyyy")
                ) : (
                  <span>Enrollment</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={enrolledDate}
                onSelect={setEnrolledDate}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !graduationDate && "text-muted-foreground",
                )}
              >
                {graduationDate ? (
                  format(graduationDate, "MMMM d, yyyy")
                ) : (
                  <span>Graduation</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={graduationDate}
                onSelect={setGraduationDate}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button
        onClick={add}
        disabled={saving || !course || !enrolledDate}
        className="self-end"
      >
        {saving ? "Saving" : "Add Education"}
      </Button>

      <div className="h-64">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {loading ? (
              <div className="h-20 animate-pulse rounded-md bg-slate-800/50" />
            ) : items.length === 0 ? (
              <p className="w-full text-center text-sm text-muted-foreground">
                You haven’t added any education records yet.
              </p>
            ) : (
              items.map((x) => (
                <div
                  key={x.id}
                  className="flex rounded-md border border-slate-800"
                >
                  <div className="flex-1 p-4">
                    <p className="w-full font-semibold text-lime-500">
                      {x.course}
                    </p>
                    <p className="pb-2 text-sm font-medium">{x.institution}</p>
                    <p className="text-xs text-muted-foreground">
                      <span>{format(x.enrolledDate, "MMM d, yyyy")}</span>
                      <span> &mdash; </span>
                      <span>{format(x.graduationDate, "MMM d, yyyy")}</span>
                    </p>
                  </div>
                  <div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="m-0 p-0 hover:bg-transparent"
                      onClick={() => remove(x.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <ScrollBar />
        </ScrollArea>
      </div>

      <div className="mt-auto flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => api?.scrollNext()}
          className="dark:bg-slate-900 dark:hover:bg-slate-900/60"
        >
          Skip
        </Button>
        <Button
          onClick={onDone}
          disabled={!items.length}
          className="bg-lime-500 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
