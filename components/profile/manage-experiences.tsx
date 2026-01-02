// components/profile/manage-experiences.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Experience = {
  id: string;
  job: string;
  company: string;
  startDate: Date | string | null;
  lastAttended: Date | string | null;
};

const schema = z.object({
  job: z.string().min(2, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  startDate: z.string().optional(), // "YYYY-MM-DD"
  lastAttended: z.string().optional(), // "YYYY-MM-DD"
});

function fmt(d?: Date | string | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM yyyy");
}

export default function ManageExperiences({
  initial,
}: {
  initial: Experience[];
}) {
  const router = useRouter();

  const [items, setItems] = useState<Experience[]>(initial);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    job: string;
    company: string;
    startDate?: string;
    lastAttended?: string;
  }>({ job: "", company: "" });

  const dialogTitle = useMemo(
    () => (editingId ? "Edit experience" : "Add experience"),
    [editingId],
  );

  function openAdd() {
    setEditingId(null);
    setForm({ job: "", company: "" });
    setOpen(true);
  }

  function openEdit(x: Experience) {
    setEditingId(x.id);
    setForm({
      job: x.job,
      company: x.company,
      startDate: x.startDate
        ? new Date(x.startDate).toISOString().slice(0, 10)
        : "",
      lastAttended: x.lastAttended
        ? new Date(x.lastAttended).toISOString().slice(0, 10)
        : "",
    });
    setOpen(true);
  }

  async function submit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return;

    const payload = {
      job: parsed.data.job.trim(),
      company: parsed.data.company.trim(),
      startDate: parsed.data.startDate
        ? new Date(`${parsed.data.startDate}T00:00:00.000Z`).toISOString()
        : undefined,
      lastAttended: parsed.data.lastAttended
        ? new Date(`${parsed.data.lastAttended}T00:00:00.000Z`).toISOString()
        : undefined,
    };

    if (editingId) {
      // Optimistic update
      setItems((prev) =>
        prev.map((x) =>
          x.id === editingId ? ({ ...x, ...payload } as Experience) : x,
        ),
      );

      const res = await fetch(`/api/profile/experiences/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // revert on failure (simple refresh)
        router.refresh();
      }
    } else {
      const res = await fetch(`/api/profile/experiences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.ok && json.data) {
          setItems((prev) => [json.data as Experience, ...prev]);
        } else {
          router.refresh();
        }
      }
    }

    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    // optimistic
    const keep = items;
    setItems((prev) => prev.filter((x) => x.id !== id));

    const res = await fetch(`/api/profile/experiences/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // revert if failed
      setItems(keep);
    }
    router.refresh();
  }

  return (
    <Card className="dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Experience</CardTitle>
          <CardDescription>Recent roles you’ve held.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={openAdd}>
              Add
            </Button>
          </div>

          <DialogContent className="bg-slate-900 p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="job">Job title</Label>
                <Input
                  id="job"
                  value={form.job}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, job: e.target.value }))
                  }
                  placeholder="e.g., Data Entry Specialist"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                  placeholder="e.g., Global Strategic BPS"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastAttended">End date</Label>
                  <Input
                    id="lastAttended"
                    type="date"
                    value={form.lastAttended ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastAttended: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={submit}>{editingId ? "Save" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4 divide-y divide-slate-800">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No experience yet.</p>
        ) : (
          items.map((e) => (
            <div
              key={e.id}
              className="flex items-start justify-between gap-4 pt-4"
            >
              <div>
                <p className="font-medium tracking-tight">{e.job}</p>
                <p className="text-sm text-slate-400">{e.company}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {fmt(e.startDate)}{" "}
                  {e.lastAttended ? `• ${fmt(e.lastAttended)}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(e)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(e.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
