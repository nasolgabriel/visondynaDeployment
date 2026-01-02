// components/applications/table/applications-table.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  ArrowDownUp,
  RefreshCcw,
  FunnelIcon,
  CircleMinus,
  CircleX,
  CircleCheck,
  BadgeCheck,
  CalendarDays,
  Search,
  LucideIcon,
  Clock,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

import ApplicationDetailsDialog from "../modals/application-details-dialog";
import PaginationControls from "@/components/jobs/pagination/pagination-controls";
import SearchInput from "@/components/jobs/controls/search-input";
import type {
  ApplicationRow,
  ApplicationsMetaCursor,
  ApplicationsMetaOffset,
  SortDir,
} from "@/lib/types";
import { ApplicationStatus } from "@prisma/client";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortKey = "applicant" | "email" | "jobTitle" | "status" | "submittedAt";

type Props = {
  initialRows: ApplicationRow[];
  initialMeta: ApplicationsMetaCursor | ApplicationsMetaOffset;
  initialLimit?: number;
};

type ApiResponse =
  | { data: ApplicationRow[]; meta: ApplicationsMetaCursor }
  | { data: ApplicationRow[]; meta: ApplicationsMetaOffset };

type StatusWithAll = ApplicationStatus | "ALL";

const StatusLabel = {
  ALL: "All Statuses",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  INTERVIEWED: "Interviewed",
  OFFERED: "Offered",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

const STATUS_ICON: Record<ApplicationStatus, LucideIcon> = {
  SUBMITTED: Clock, // or CircleMinus if you prefer
  UNDER_REVIEW: Search, // or CircleMinus
  SHORTLISTED: CircleMinus, // or CircleMinus
  INTERVIEWED: CalendarDays, // or CircleMinus
  OFFERED: BadgeCheck,
  HIRED: CircleCheck,
  REJECTED: CircleX,
};

const iconClassByStatus: Record<ApplicationStatus, string> = {
  SUBMITTED: "size-4 stroke-slate-500",
  UNDER_REVIEW: "size-4 stroke-slate-500",
  SHORTLISTED: "size-4 fill-slate-500 stroke-white dark:stroke-slate-950",
  INTERVIEWED: "size-4 stroke-slate-500",
  OFFERED: "size-4 fill-cyan-500 stroke-white dark:stroke-slate-950",
  HIRED: "size-4 fill-lime-500 stroke-white dark:stroke-slate-950",
  REJECTED: "size-4 fill-red-500 stroke-white dark:stroke-slate-950",
};

const ENDPOINT = "/api/applications";

export function renderStatusPill(status: ApplicationStatus) {
  const Icon = STATUS_ICON[status];
  const iconClass = iconClassByStatus[status];
  const label = StatusLabel[status];

  return (
    <Badge variant="outline" className="inline-flex items-center gap-1">
      <Icon className={iconClass} />
      <span>{label}</span>
    </Badge>
  );
}

export default function ApplicationsTable({
  initialRows,
  initialMeta,
  initialLimit = 10,
}: Props) {
  const [rows, setRows] = useState<ApplicationRow[]>(initialRows);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // filters
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusWithAll>("ALL");

  // sorting
  const [sortBy, setSortBy] = useState<SortKey>(initialMeta.sortBy);
  const [sortDir, setSortDir] = useState<SortDir>(initialMeta.sortDir);

  // pagination
  const [limit, setLimit] = useState(initialLimit);
  const [pagingMode, setPagingMode] = useState<"cursor" | "offset">(
    initialMeta.paging.mode,
  );

  // cursor state (submittedAt default)
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialMeta.paging.mode === "cursor" ? initialMeta.paging.nextCursor : null,
  );
  const backStackRef = useRef<(string | null)[]>([]);

  // offset state
  const [page, setPage] = useState(
    initialMeta.paging.mode === "offset" ? initialMeta.paging.page : 1,
  );
  const [totalPages, setTotalPages] = useState(
    initialMeta.paging.mode === "offset" ? initialMeta.paging.totalPages : 1,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      resetToFirstPage();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  function resetToFirstPage() {
    if (sortBy === "submittedAt") {
      setCursor(null);
      backStackRef.current = [];
    } else {
      setPage(1);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir(key === "submittedAt" ? "desc" : "asc");
      if (key === "submittedAt") {
        setCursor(null);
        backStackRef.current = [];
        setPagingMode("cursor");
      } else {
        setPage(1);
        setPagingMode("offset");
      }
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    resetToFirstPage();
  }

  function renderSortIcon(column: SortKey) {
    if (sortBy !== column)
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUpDown className="h-3 w-3" />
    ) : (
      <ArrowDownUp className="h-3 w-3" />
    );
  }

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    if (q) params.set("q", q);
    if (status !== "ALL") params.set("status", status);

    if (sortBy === "submittedAt") {
      if (cursor) params.set("cursor", cursor);
    } else {
      params.set("page", String(page));
    }
    return params.toString();
  }, [limit, sortBy, sortDir, q, status, cursor, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setIsError(null);
      try {
        const res = await fetch(`${ENDPOINT}?${queryString}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as ApiResponse;
        if (cancelled) return;

        setRows(json.data ?? []);
        const mode = json.meta.paging.mode;
        setPagingMode(mode);

        if (mode === "cursor") {
          setNextCursor(json.meta.paging.nextCursor);
        } else {
          setTotalPages(json.meta.paging.totalPages);
        }
      } catch (e) {
        setIsError(
          e instanceof Error ? e.message : "Failed to load applications.",
        );
        setRows([]);
        setNextCursor(null);
        setTotalPages(1);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  function handlePrev() {
    if (pagingMode === "cursor") {
      const prev = backStackRef.current.pop() ?? null;
      setCursor(prev);
    } else {
      setPage((p) => Math.max(1, p - 1));
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

  function handleLimitChange(n: number) {
    setLimit(n);
    resetToFirstPage();
  }

  async function refresh() {
    try {
      setIsLoading(true);
      const res = await fetch(`${ENDPOINT}?${queryString}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Refresh failed.");
      const json = (await res.json()) as ApiResponse;

      setRows(json.data ?? []);
      const mode = json.meta.paging.mode;
      setPagingMode(mode);
      if (mode === "cursor") {
        setNextCursor(json.meta.paging.nextCursor);
      } else {
        setTotalPages(json.meta.paging.totalPages);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function openDetails(id: string) {
    setSelectedId(id);
    setOpenDialog(true);
  }

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchInput
          value={qInput}
          onChange={setQInput}
          resultsHint={rows.length}
          loading={isLoading}
          placeholder="Applicant Name, Email, or Job Title"
        />

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FunnelIcon />
                <span className="text-muted-foreground">
                  {status === "ALL" ? "All Statuses" : StatusLabel[status]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuGroup className="space-y-1">
                {Object.keys(StatusLabel).map((key, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => {
                      setStatus(key as StatusWithAll);
                      resetToFirstPage();
                    }}
                  >
                    {StatusLabel[key as StatusWithAll]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={refresh} className="bg-lime-500 text-white">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden rounded-md">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase">
                <TableHead className="px-4 py-2">
                  <button
                    onClick={() => toggleSort("applicant")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    Applicant Name
                    {renderSortIcon("applicant")}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2">
                  <button
                    onClick={() => toggleSort("email")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    Email
                    {renderSortIcon("email")}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2">
                  <button
                    onClick={() => toggleSort("jobTitle")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    Job
                    {renderSortIcon("jobTitle")}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2">
                  <button
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    Status
                    {renderSortIcon("status")}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-2">
                  <button
                    onClick={() => toggleSort("submittedAt")}
                    className="inline-flex items-center gap-1 uppercase"
                  >
                    Applied On
                    {renderSortIcon("submittedAt")}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading && rows.length === 0 ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6">
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                      <p className="font-medium text-destructive">
                        Failed to load applications
                      </p>
                      <p className="text-muted-foreground">{isError}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((a) => (
                  <TableRow key={a.id} onClick={() => openDetails(a.id)}>
                    <TableCell className="px-4 py-2 font-medium dark:text-slate-50">
                      {a.applicant.name}
                    </TableCell>
                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      {a.applicant.email}
                    </TableCell>
                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      {a.job?.title ? `${a.job.title} — ${a.job.company}` : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {renderStatusPill(a.status)}
                    </TableCell>
                    <TableCell className="px-4 py-2 dark:text-slate-300">
                      {format(a.submittedAt, "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
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

      {/* Details */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        {selectedId && (
          <ApplicationDetailsDialog
            applicationId={selectedId}
            onClose={() => {
              setSelectedId(null);
              setOpenDialog(false);
            }}
            onUpdated={refresh}
          />
        )}
      </Dialog>
    </>
  );
}
