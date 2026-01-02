"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowDownUp, ArchiveRestore } from "lucide-react";

import SearchInput from "@/components/jobs/controls/search-input";
import CategoryFilter from "@/components/jobs/controls/category-filter";
import PaginationControls from "@/components/jobs/pagination/pagination-controls";
import { toTitleCase } from "@/lib/utils";
import { Button } from "../../ui/button";
import { Dialog } from "../../ui/dialog";
import JobDetailsDialogContent from "../modals/job-detail-content";
import type { JobStatus } from "@prisma/client";
import { format } from "date-fns";

type Category = {
  id: string;
  name: string;
  _count?: {
    skills?: number;
    jobs?: number;
  };
};

type ArchivedJobRow = {
  id: string;
  title: string;
  description: string;
  manpower: number;
  salary: number;
  company: string;
  location: string;
  status: JobStatus;
  createdAt: string;
  categoryId: string;
  category: { id: string; name: string } | null;
  applicantsCount: number;
};

type PagingMeta = {
  mode: "offset";
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type JobsResponseMeta = {
  limit: number;
  sortBy: "title" | "salary" | "applications" | "createdAt";
  sortDir: "asc" | "desc";
  paging: PagingMeta;
};

type JobsResponse = {
  data: ArchivedJobRow[];
  meta: JobsResponseMeta;
};

const ENDPOINT = "/api/archived-jobs";
const CATEGORIES_ENDPOINT = "/api/categories";

type SortKey = "title" | "salary" | "applications" | "createdAt";
type SortDir = "asc" | "desc";

export default function ArchivedJobsTable() {
  const [jobs, setJobs] = useState<ArchivedJobRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [qInput, setQInput] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const [categoryId, setCategoryId] = useState<string>("");

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // load categories once
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
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("page", String(page));
    params.set("sortBy", sortKey);
    params.set("sortDir", sortDir);
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    return params.toString();
  }, [limit, page, sortKey, sortDir, q, categoryId]);

  // fetch archived jobs
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

        if (!res.ok) throw new Error("Failed to load archived jobs");

        const json = (await res.json()) as JobsResponse;
        if (cancelled) return;

        setJobs(json.data ?? []);
        setTotalPages(json.meta.paging.totalPages);
      } catch (e) {
        if (!cancelled) {
          setIsError(
            e instanceof Error ? e.message : "Failed to load archived jobs.",
          );
          setJobs([]);
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

  // unarchive handler
  async function handleUnarchive(id: string) {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletedAt: null }),
      });

      if (!res.ok) throw new Error(await res.text());

      // instantly remove from archived table
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  function handlePrev() {
    setPage((p) => Math.max(1, p - 1));
  }

  function handleNext() {
    setPage((p) => Math.min(totalPages, p + 1));
  }

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
      setPage(1);
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  function handleSelect(id: string) {
    setOpenDialog(true);
    setSelected(id);
  }

  function renderSortIcon(column: SortKey) {
    if (sortKey !== column)
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUpDown className="h-3 w-3" />
    ) : (
      <ArrowDownUp className="h-3 w-3" />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Archived Jobs</h1>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchInput
          value={qInput}
          onChange={setQInput}
          resultsHint={jobs.length}
          loading={isLoading}
          placeholder="Search archived job"
        />

        <div className="flex items-center gap-2">
          <CategoryFilter
            categories={categories}
            value={categoryId}
            onChange={(id) => {
              setCategoryId(id);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card className="overflow-hidden rounded-md border">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase">
                <TableHead className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSort("title")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    <span>Title</span>
                    {renderSortIcon("title")}
                  </button>
                </TableHead>

                <TableHead className="px-4 py-2">Company</TableHead>
                <TableHead className="px-4 py-2">Category</TableHead>

                <TableHead className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSort("salary")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    Salary
                    {renderSortIcon("salary")}
                  </button>
                </TableHead>

                <TableHead className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSort("applications")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    Applicants
                    {renderSortIcon("applications")}
                  </button>
                </TableHead>

                <TableHead className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSort("createdAt")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    Archived On
                    {renderSortIcon("createdAt")}
                  </button>
                </TableHead>

                <TableHead className="px-4 py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Skeleton loading */}
              {isLoading && jobs.length === 0 ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[40, 32, 28, 24, 20, 28, 24].map((w, idx) => (
                        <TableCell className="px-4 py-3" key={idx}>
                          <div
                            className={`h-3 w-${w} animate-pulse rounded bg-muted`}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-4 py-6 text-center text-red-300"
                  >
                    {isError}
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No archived jobs found.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} onClick={() => handleSelect(job.id)}>
                    <TableCell className="px-4 py-2 font-medium dark:text-slate-50">
                      {job.title}
                    </TableCell>

                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      {job.company}
                    </TableCell>

                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      {job.category ? toTitleCase(job.category.name) : "—"}
                    </TableCell>

                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      ₱ {job.salary.toLocaleString()}
                    </TableCell>

                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      {job.applicantsCount}
                    </TableCell>

                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      {format(job.createdAt, "dd MMM yyyy")}
                    </TableCell>

                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnarchive(job.id);
                        }}
                        className="transition hover:bg-slate-400"
                      >
                        <ArchiveRestore className="size-4" />
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
        pagingMode="offset"
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        canPrev={page > 1}
        canNext={page < totalPages}
        limit={limit}
        onPrev={handlePrev}
        onNext={handleNext}
        onLimitChange={handleLimitChange}
        cursorStackLen={0}
      />

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <JobDetailsDialogContent
          jobId={selected}
          onClose={() => {
            setSelected("");
            setOpenDialog(false);
          }}
          onUpdate={() => {}}
          onDeleted={(id) => {
            setJobs((prev) => prev.filter((job) => job.id !== id));
            setSelected("");
            setOpenDialog(false);
          }}
        />
      </Dialog>
    </div>
  );
}
