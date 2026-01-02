// components/profile/manage-skills.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn, toTitleCase } from "@/lib/utils";

type Skill = { id: string; name: string };
type Category = { id: string; name: string; skills: Skill[] };

export default function ManageSkills() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [catRes, selRes] = await Promise.all([
          fetch("/api/categories?withSkills=1", {
            headers: { Accept: "application/json" },
          }).then((r) => r.json()),
          fetch("/api/profile/skills", {
            headers: { Accept: "application/json" },
          }).then((r) => r.json()),
        ]);
        if (cancel) return;

        if (catRes?.ok) {
          setCategories(catRes.data as Category[]);
          setActiveCategoryId(catRes.data[0]?.id ?? null);
        }
        if (selRes?.ok && Array.isArray(selRes.data)) {
          setSelected(new Set(selRes.data as string[]));
        }
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const activeSkills = useMemo<Skill[]>(() => {
    const active = categories.find((c) => c.id === activeCategoryId);
    if (!active) return [];
    const list = active.skills;
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(needle));
  }, [categories, activeCategoryId, q]);

  function toggleSkill(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const body = { skillIds: Array.from(selected) };
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save skills");
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit skills</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search skills"
          />
          <Select
            onValueChange={setActiveCategoryId}
            defaultValue={activeCategoryId || ""}
          >
            <SelectTrigger className="min-w-[12rem]">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Categories</SelectLabel>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {toTitleCase(c.name)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="min-h-0 flex-1">
          <ScrollArea className="mt-3 h-64 rounded-md border border-slate-800 p-3">
            <div className="flex flex-wrap justify-center gap-2 pr-2">
              {activeSkills.length === 0 ? (
                <span className="text-sm text-slate-400">No skills.</span>
              ) : (
                activeSkills.map((s) => {
                  const picked = selected.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSkill(s.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition",
                        picked
                          ? "border-lime-600 bg-lime-500/20 text-lime-400"
                          : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800",
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })
              )}
            </div>
            <ScrollBar />
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
