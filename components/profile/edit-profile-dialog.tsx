// components/profile/edit-profile-dialog.tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil } from "lucide-react";

const schema = z.object({
  profession: z.string().trim().min(1, "Profession is required").max(100),
  phone: z.string().trim().max(40).optional(),
  profileSummary: z.string().trim().max(2000).optional(),
  profileCompleted: z.boolean().optional(),
});

type Initial = z.infer<typeof schema>;

export default function EditProfileDialog({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Initial>(initial);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    const res = schema.safeParse(form);
    if (!res.success) {
      const msg =
        res.error.issues[0]?.message ??
        "Please check your input and try again.";
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(res.data),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) {
        toast.error("Could not update profile.");
        return;
      }
      toast.success("Profile updated.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-2">
          <Pencil size={14} />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 p-6">
        <DialogHeader>
          <DialogTitle>Edit information</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Profession
            </label>
            <Input
              value={form.profession ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, profession: e.target.value }))
              }
              placeholder="e.g. Data Entry Specialist"
              className="bg-slate-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Phone</label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="+63 9xx xxx xxxx"
              className="bg-slate-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Summary</label>
            <Textarea
              rows={5}
              value={form.profileSummary ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, profileSummary: e.target.value }))
              }
              placeholder="Write a short introduction about your strengths, tools, and impact."
              className="bg-slate-950"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="done"
              checked={!!form.profileCompleted}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, profileCompleted: Boolean(v) }))
              }
            />
            <label htmlFor="done" className="text-sm text-slate-300">
              Mark profile as completed
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
