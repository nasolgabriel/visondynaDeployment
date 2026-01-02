"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Building2, CalendarIcon, SquareUser, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

type Exp = {
  id: string;
  job: string;
  company: string;
  startDate: Date;
  lastAttended: Date;
};

export default function SetupExperience() {
  const [items, setItems] = useState<Exp[]>([]);

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [lastAttended, setLastAttended] = useState<Date>();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("/api/profile/experiences");
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
      const res = await fetch("/api/profile/experiences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          job: jobTitle,
          company,
          startDate,
          lastAttended,
        }),
      });
      const json = await res.json();
      if (res.ok && json?.ok) {
        setItems((prev) => [json.data, ...prev]);

        setJobTitle("");
        setCompany("");
        setStartDate(undefined);
        setLastAttended(undefined);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/profile/experiences/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="w-full font-medium">Tell Us About Your Work History</p>
        <p className="w-full text-sm text-muted-foreground">
          Add your previous roles, companies, responsibilities, and employment
          dates. Sharing your experience helps employers understand your
          background and skill set.
        </p>
      </div>
      <div className="space-y-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
          <InputGroupAddon>
            <SquareUser className="size-4" />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <InputGroupAddon>
            <Building2 className="size-4" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !startDate && "text-muted-foreground",
                )}
              >
                {startDate ? (
                  format(startDate, "MMMM d, yyyy")
                ) : (
                  <span>Start Date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
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
                  !lastAttended && "text-muted-foreground",
                )}
              >
                {lastAttended ? (
                  format(lastAttended, "MMMM d, yyyy")
                ) : (
                  <span>Last Attended</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={lastAttended}
                onSelect={setLastAttended}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Button
        onClick={add}
        disabled={saving || !jobTitle || !company}
        className="self-end"
      >
        {saving ? "Saving" : "Add Experience"}
      </Button>

      <div className="h-64">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {loading ? (
              <div className="h-20 animate-pulse rounded bg-slate-800/50" />
            ) : items.length === 0 ? (
              <p className="w-full text-center text-sm text-muted-foreground">
                No work experience added yet. Add your first role to begin.
              </p>
            ) : (
              items.map((x) => (
                <div
                  key={x.id}
                  className="flex rounded-md border border-slate-800"
                >
                  <div className="flex-1 p-4">
                    <p className="w-full font-semibold text-lime-500">
                      {x.job}
                    </p>
                    <p className="pb-2 text-sm font-medium">{x.company}</p>
                    <p className="text-xs text-muted-foreground">
                      <span>{format(x.startDate, "MMM d, yyyy")}</span>
                      <span> &mdash; </span>
                      <span>{format(x.lastAttended, "MMM d, yyyy")}</span>
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
    </div>
  );
}
