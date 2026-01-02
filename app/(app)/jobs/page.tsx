"use client";

import JobCard from "@/components/job-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Job } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Category = { id: string; name: string };

// What the API actually returns (createdAt is a string in JSON)
type JobWithSkills = Job & {
  skills: { skillTag: { id: string; name: string } }[];
};

// What our UI consumes
type JobUI = Omit<JobWithSkills, "createdAt"> & { createdAt: Date };

type JobsResponse = {
  ok: true;
  data: JobWithSkills[];
  meta?: { nextCursor?: string | null; limit?: number };
};

type CategoriesResponse = { ok: true; data: Category[] };

const PAGE_SIZE = 10;

// Normalize API -> UI (convert date string to Date)
const toJob = (j: JobWithSkills): JobUI => ({
  ...j,
  createdAt: new Date(j.createdAt),
});

export default function JobsPage() {
  // Sidebar
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  );

  // Feed
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stable, always-up-to-date flags/values for the observer callback
  const cursorRef = useRef<string | null>(null);
  const hasNextRef = useRef<boolean>(true);
  const fetchingRef = useRef<boolean>(false);
  const loadingRef = useRef<boolean>(false);
  const categoryRef = useRef<string | null>(null);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);
  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);
  useEffect(() => {
    fetchingRef.current = isFetchingMore;
  }, [isFetchingMore]);
  useEffect(() => {
    loadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    categoryRef.current = selectedCategoryId;
  }, [selectedCategoryId]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load categories once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories", {
          headers: { Accept: "application/json" },
        });
        const json: CategoriesResponse = await res.json();
        if (!cancelled && json?.ok) setCategories(json.data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // STABLE fetcher (no deps) — uses refs to read latest state safely
  const fetchJobsPage = useCallback(async (opts?: { reset?: boolean }) => {
    const reset = opts?.reset === true;

    if (reset) {
      setIsLoading(true);
      loadingRef.current = true;
      setErrorMsg(null);
      setCursor(null);
      cursorRef.current = null;
      setHasNext(true);
      hasNextRef.current = true;
      setJobs([]);
    } else {
      // guard against duplicate/illegal loads
      if (loadingRef.current || fetchingRef.current || !hasNextRef.current)
        return;
      setIsFetchingMore(true);
      fetchingRef.current = true;
    }

    try {
      const url = new URL("/api/jobs", window.location.origin);
      url.searchParams.set("limit", String(PAGE_SIZE));
      const cat = categoryRef.current;
      const cur = reset ? null : cursorRef.current;
      if (cat) url.searchParams.set("categoryId", cat);
      if (cur) url.searchParams.set("cursor", cur);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Failed to load jobs (${res.status})`);
      const json: JobsResponse = await res.json();

      const batch = json.data.map(toJob);
      const nextCursor = json.meta?.nextCursor ?? null;

      setJobs((prev) => (reset ? batch : [...prev, ...batch]));
      setCursor(nextCursor);
      cursorRef.current = nextCursor;

      const more = Boolean(nextCursor);
      setHasNext(more);
      hasNextRef.current = more;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      if (reset) {
        setIsLoading(false);
        loadingRef.current = false;
      } else {
        setIsFetchingMore(false);
        fetchingRef.current = false;
      }
    }
  }, []);

  // Initial + refetch on category change
  useEffect(() => {
    fetchJobsPage({ reset: true });
  }, [selectedCategoryId, fetchJobsPage]);

  // IntersectionObserver — attach ONCE; sentinel is ALWAYS in the DOM
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          fetchJobsPage();
        }
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchJobsPage]); // stable callback

  // Sidebar interactions
  function toggleCategory(id: string) {
    setPendingCategoryId((prev) => (prev === id ? null : id));
  }
  function applyFilter() {
    setSelectedCategoryId(pendingCategoryId ?? null);
  }

  return (
    <div className="relative mx-auto flex w-4/5 flex-row items-start gap-6">
      <Card className="sticky top-0 w-3/12 flex-none self-start dark:bg-slate-950">
        <CardHeader>
          <InputGroup>
            <InputGroupInput placeholder="Search..." disabled={isLoading} />
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
          </InputGroup>
        </CardHeader>
        <CardContent className="space-y-2">
          <CardTitle>Categories</CardTitle>
          {categories.map((category) => {
            const checked = pendingCategoryId === category.id;
            return (
              <Field key={category.id} orientation="horizontal">
                <Checkbox
                  id={category.name}
                  className="dark:border-slate-700 dark:bg-slate-950/25"
                  checked={checked}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <FieldLabel htmlFor={category.name} className="font-normal">
                  {toTitleCase(category.name)}
                </FieldLabel>
              </Field>
            );
          })}
        </CardContent>
        <CardFooter>
          <Button
            variant="secondary"
            className="w-full dark:bg-slate-900 dark:hover:bg-slate-900/60"
            onClick={applyFilter}
          >
            Apply
          </Button>
        </CardFooter>
      </Card>

      <div className="min-w-0 flex-1 space-y-6">
        {isLoading && jobs.length === 0 ? (
          <SkeletonList />
        ) : errorMsg ? (
          <ErrorBox
            message={errorMsg}
            onRetry={() => fetchJobsPage({ reset: true })}
          />
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
            {isFetchingMore && <LoadingMore />}
            {!hasNext && jobs.length > 0 && (
              <div className="py-4 text-center text-sm text-slate-500">
                You’re all caught up
              </div>
            )}
          </>
        )}

        {/* 👇 Sentinel is ALWAYS present so the observer can attach reliably */}
        <div ref={sentinelRef} className="h-px w-full" />
      </div>

      <Card className="sticky top-0 w-3/12 flex-none self-start dark:bg-slate-950">
        <CardContent>{/* reserved */}</CardContent>
      </Card>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-lg bg-slate-800/60" />
      ))}
    </div>
  );
}

function LoadingMore() {
  return (
    <div className="py-4 text-center text-sm text-slate-400">Loading more…</div>
  );
}

function EmptyState() {
  return (
    <Card className="bg-slate-900">
      <CardHeader>
        <CardTitle>No jobs yet</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-400">
        Try a different category or check back later.
      </CardContent>
    </Card>
  );
}

function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-red-900 bg-red-950/40">
      <CardHeader>
        <CardTitle className="text-red-300">Couldn’t load jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-red-200/80">{message}</p>
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
