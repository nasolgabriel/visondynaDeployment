"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowDownUp,
  ArrowUpDown,
  CircleCheckIcon,
  CircleMinusIcon,
  CircleXIcon,
  PanelRightOpen,
  Plus,
} from "lucide-react";

import SearchInput from "@/components/jobs/controls/search-input";
import CategoryFilter from "@/components/jobs/controls/category-filter";
import StatusFilter from "@/components/jobs/controls/status-filter";
import PaginationControls from "@/components/jobs/pagination/pagination-controls";

import type {
  Category,
  Job,
  JobsMetaCursor,
  JobsMetaOffset,
  SortDir,
  SortKey,
} from "@/lib/types";
import { toTitleCase } from "@/lib/utils";
import CreateJobSheetContent from "../modals/create-job-content";
import { Sheet } from "../../ui/sheet";
import { Dialog } from "../../ui/dialog";
import JobDetailsDialogContent from "../modals/job-detail-content";
import { Badge } from "../../ui/badge";

type JobsResponse =
  | { data: Job[]; meta: JobsMetaCursor }
  | { data: Job[]; meta: JobsMetaOffset };

const ENDPOINT = "/api/jobs";
const CATEGORIES_ENDPOINT = "/api/categories";

type Props = {
  initialJobs: Job[];
  initialMeta: JobsMetaCursor | JobsMetaOffset;
  initialCategories: Category[];
  initialLimit?: number;
};

export default function JobsTableClient({
  initialJobs,
  initialMeta,
  initialCategories,
  initialLimit = 10,
}: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [categories, setCategories] = useState<Category[]>(
    initialCategories ?? [],
  );
  const [open, setOpen] = useState(false); // sheet
  const [selected, setSelected] = useState<string | null>(null); // job id for view/edit
  const [openDialog, setOpenDialog] = useState<boolean>(false); // details dialog

  // filters/search
  const [qInput, setQInput] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<"ALL" | Job["status"]>("ALL");

  // sorting
  const [sortKey, setSortKey] = useState<SortKey>(initialMeta.sortBy);
  const [sortDir, setSortDir] = useState<SortDir>(initialMeta.sortDir);

  // pagination
  const [limit, setLimit] = useState<number>(initialLimit);

  // cursor-based state (for createdAt sort)
  const [cursor, setCursor] = useState<string | null>(null);
  const backStackRef = useRef<(string | null)[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialMeta.paging.mode === "cursor" ? initialMeta.paging.nextCursor : null,
  );

  // offset-based state (for other sorts)
  const [page, setPage] = useState<number>(
    initialMeta.paging.mode === "offset" ? initialMeta.paging.page : 1,
  );
  const [totalPages, setTotalPages] = useState<number>(
    initialMeta.paging.mode === "offset" ? initialMeta.paging.totalPages : 1,
  );

  const [pagingMode, setPagingMode] = useState<"cursor" | "offset">(
    initialMeta.paging.mode,
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<string | null>(null);

  // debounce qInput -> q
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      resetToFirstPage();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  // refresh categories once on mount (in case SSR gets stale)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(CATEGORIES_ENDPOINT, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data: Category[] };
        if (!cancelled && json.data) setCategories(json.data);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // build query
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("sortBy", sortKey);
    params.set("sortDir", sortDir);
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    if (status !== "ALL") params.set("status", status);

    if (sortKey === "createdAt") {
      if (cursor) params.set("cursor", cursor);
    } else {
      params.set("page", String(page));
    }

    return params.toString();
  }, [limit, sortKey, sortDir, q, categoryId, status, cursor, page]);

  // fetch jobs when query changes
  useEffect(() => {
    let cancelled = false;

    async function fetchJobs() {
      setIsLoading(true);
      setIsError(null);
      try {
        const res = await fetch(`${ENDPOINT}?${queryString}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed: ${res.status}`);
        }
        const json = (await res.json()) as JobsResponse;
        if (cancelled) return;

        setJobs(json.data ?? []);

        const mode = json.meta.paging.mode;
        setPagingMode(mode);

        if (mode === "cursor") {
          setNextCursor(json.meta.paging.nextCursor);
        } else {
          setTotalPages(json.meta.paging.totalPages);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load jobs.";
        if (!cancelled) {
          setIsError(message);
          setJobs([]);
          setNextCursor(null);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  // helpers
  function resetToFirstPage() {
    if (sortKey === "createdAt") {
      setCursor(null);
      backStackRef.current = [];
    } else {
      setPage(1);
    }
  }

  function handleNext() {
    if (pagingMode === "cursor") {
      if (!nextCursor) return;
      backStackRef.current.push(cursor);
      setCursor(nextCursor);
    } else {
      if (page >= totalPages) return;
      setPage((p) => Math.min(totalPages, p + 1));
    }
  }

  function handlePrev() {
    if (pagingMode === "cursor") {
      const prevCursor = backStackRef.current.pop() ?? null;
      setCursor(prevCursor);
    } else {
      setPage((p) => Math.max(1, p - 1));
    }
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    resetToFirstPage();
  }

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
      if (key === "createdAt") {
        setCursor(null);
        backStackRef.current = [];
      } else {
        setPage(1);
      }
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    resetToFirstPage();
  }

  // open View dialog
  function handleSelect(id: string) {
    setSelected(id);
    setOpenDialog(true);
  }

  // open sheet for NEW job
  function handleOpenCreate() {
    setSelected(null);
    setOpen(true);
  }

  // open sheet for EDIT job
  function handleOpenEdit(e: React.MouseEvent<HTMLElement>, id: string) {
    e.stopPropagation();

    setSelected(id);
    setOpen(true);
  }

  function applicantsOf(job: Job) {
    return job._count?.applications ?? job.applicantsCount ?? 0;
  }

  function renderSortIcon(column: SortKey) {
    if (sortKey !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortDir === "asc" ? (
      <ArrowUpDown className="h-3 w-3" />
    ) : (
      <ArrowDownUp className="h-3 w-3" />
    );
  }

  async function refreshJobs() {
    try {
      setIsLoading(true);
      const res = await fetch(`${ENDPOINT}?${queryString}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to refresh jobs`);
      const json = (await res.json()) as JobsResponse;

      setJobs(json.data ?? []);
      const mode = json.meta.paging.mode;
      setPagingMode(mode);
      if (mode === "cursor") {
        setNextCursor(json.meta.paging.nextCursor);
      } else {
        setTotalPages(json.meta.paging.totalPages);
      }
    } catch (e) {
      console.error("refreshJobs error:", e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-0 space-y-6 duration-300 animate-in fade-in">
        <h1 className="text-lg font-semibold">Jobs Management</h1>

        <div className="flex items-center justify-between gap-2">
          <SearchInput
            value={qInput}
            onChange={setQInput}
            resultsHint={jobs.length}
            loading={isLoading}
            placeholder="Title, Company, or Location"
          />
          <div className="flex items-center gap-2">
            <CategoryFilter
              categories={categories}
              value={categoryId}
              onChange={(id) => {
                setCategoryId(id);
                resetToFirstPage();
              }}
            />
            <StatusFilter
              value={status}
              onChange={(s) => {
                setStatus(s);
                resetToFirstPage();
              }}
            />
            <Button
              className="bg-lime-500 text-accent dark:text-accent-foreground"
              onClick={handleOpenCreate}
            >
              <Plus className="size-4" />
              <span>New</span>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden rounded-md">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase">
                  <TableHead className="px-4 py-2">
                    <button
                      onClick={() => toggleSort("title")}
                      className="inline-flex items-center gap-1 uppercase"
                      aria-label="Sort by title"
                    >
                      <span>Title</span>
                      {renderSortIcon("title")}
                    </button>
                  </TableHead>

                  <TableHead className="px-4 py-2">Company</TableHead>
                  <TableHead className="px-4 py-2">Category</TableHead>
                  <TableHead className="px-4 py-2">
                    <button
                      onClick={() => toggleSort("salary")}
                      className="inline-flex items-center gap-1 uppercase"
                      aria-label="Sort by salary"
                    >
                      <span>Salary</span>
                      {renderSortIcon("salary")}
                    </button>
                  </TableHead>
                  <TableHead className="px-4 py-2">
                    <button
                      onClick={() => toggleSort("applications")}
                      className="inline-flex items-center gap-1 uppercase"
                      aria-label="Sort by applicants"
                    >
                      <span>Applicants</span>
                      {renderSortIcon("applications")}
                    </button>
                  </TableHead>
                  <TableHead className="px-4 py-2">Status</TableHead>
                  <TableHead className="px-4 py-2">Location</TableHead>
                  <TableHead className="px-4 py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && jobs.length === 0 ? (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={1} className="px-4 py-3">
                          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6">
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <p className="font-medium text-destructive">
                          Failed to load jobs
                        </p>
                        <p className="text-muted-foreground">{isError}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      There are no active job listings.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id} onClick={() => handleSelect(job.id)}>
                      <TableCell className="px-4 py-2 align-middle font-medium dark:text-slate-50">
                        {job.title}
                      </TableCell>

                      <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                        {job.company}
                      </TableCell>

                      <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                        {toTitleCase(job.category?.name ?? "—")}
                      </TableCell>

                      <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                        ₱ {job.salary.toLocaleString()}
                      </TableCell>

                      <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                        {applicantsOf(job)}
                      </TableCell>

                      <TableCell className="px-4 py-2 align-middle text-xs dark:text-slate-300">
                        <Badge
                          variant="outline"
                          className="inline-flex items-center gap-1 rounded-full px-1.5 text-muted-foreground"
                        >
                          {job.status === "OPEN" ? (
                            <CircleCheckIcon className="size-4 fill-lime-500 stroke-white dark:stroke-slate-950" />
                          ) : job.status === "CLOSED" ? (
                            <CircleXIcon className="size-4 fill-red-500 stroke-white dark:stroke-slate-950" />
                          ) : (
                            <CircleMinusIcon className="size-4 fill-slate-500 stroke-white dark:stroke-slate-950" />
                          )}
                          {toTitleCase(job.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                        {job.location}
                      </TableCell>

                      <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenEdit(e, job.id)}
                        >
                          <PanelRightOpen className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <PaginationControls
          pagingMode={pagingMode}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          canPrev={
            pagingMode === "cursor" ? backStackRef.current.length > 0 : page > 1
          }
          canNext={
            pagingMode === "cursor" ? Boolean(nextCursor) : page < totalPages
          }
          limit={limit}
          onPrev={handlePrev}
          onNext={handleNext}
          onLimitChange={handleLimitChange}
          cursorStackLen={backStackRef.current.length}
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <CreateJobSheetContent
          jobId={selected}
          onSuccess={() => {
            setOpen(false);
            refreshJobs();
          }}
          onCancel={() => {
            setOpen(false);
          }}
        />
      </Sheet>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <JobDetailsDialogContent
          jobId={selected ?? ""}
          onClose={() => {
            setSelected(null);
            setOpenDialog(false);
          }}
          onUpdate={refreshJobs}
          onDeleted={(id) => {
            setJobs((prev) => prev.filter((job) => job.id !== id));
            setSelected(null);
            setOpenDialog(false);
          }}
        />
      </Dialog>
    </>
  );
}
