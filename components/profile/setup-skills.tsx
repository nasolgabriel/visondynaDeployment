"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CarouselApi } from "@/components/ui/carousel";
import { cn, toTitleCase } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Search, Tag } from "lucide-react";
import { Badge } from "../ui/badge";

type Skill = { id: string; name: string };
type Category = { id: string; name: string; skills: Skill[] };

export default function SetupSkills({ api }: { api?: CarouselApi }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);

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
          setCategories(catRes.data);
          setActiveCategoryId(catRes.data[0]?.id ?? null);
        }
        if (selRes?.ok && Array.isArray(selRes.data)) {
          setSelected(new Set(selRes.data as string[]));
        }
      } catch {}

      setLoading(false);
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
      api?.scrollNext();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div>
        <p className="w-full font-medium">
          Select the skills that best match your experience.
        </p>
        <p className="w-full text-sm text-muted-foreground">
          Pick the skills you’ve developed through past roles, training, or
          hands-on experience. This helps us match you with the right jobs and
          highlight your capabilities to employers. Select as many as apply.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center justify-between gap-3 pt-2">
        <InputGroup>
          <InputGroupInput
            value={q}
            type="search"
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search skills"
            className="w-full"
          />
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <Select
            onValueChange={(e) => setActiveCategoryId(e)}
            defaultValue={activeCategoryId || ""}
          >
            <SelectTrigger className="min-w-[12rem] border-none focus:ring-0">
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
          <InputGroupAddon>
            <Tag className="size-4" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex h-full w-full items-center">
        <div className="flex w-full flex-wrap justify-center gap-2 pr-2">
          {activeSkills.length === 0 ? (
            <p className="w-full text-center text-sm text-slate-400">
              Cannot find specific skill, maybe try a different word or phrase.
            </p>
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
                      : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-900/60",
                  )}
                >
                  {s.name}
                </button>
              );
            })
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {Array.from(selected)
            .slice(0, 10)
            .map((id) => {
              const name =
                categories.flatMap((c) => c.skills).find((s) => s.id === id)
                  ?.name ?? "Skill";
              return (
                <Badge key={id} variant="outline">
                  {name}
                </Badge>
              );
            })}
          {selected.size > 10 && (
            <Badge variant="secondary">+{selected.size - 10} more</Badge>
          )}
        </div>
      )}

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
          onClick={save}
          disabled={saving || loading || selected.size <= 0}
          className="bg-lime-500 text-white"
        >
          {saving ? "Saving" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
