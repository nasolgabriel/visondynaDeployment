"use client";

import { Button } from "@/components/ui/button";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import PageSizePicker from "../controls/page-size-picker";

type Mode = "cursor" | "offset";

type Props = {
  pagingMode: Mode;
  isLoading: boolean;
  page: number;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
  onLimitChange: (n: number) => void;
  cursorStackLen: number; // for cursor “page number”
};

export default function PaginationControls({
  pagingMode,
  isLoading,
  page,
  totalPages,
  canPrev,
  canNext,
  limit,
  onPrev,
  onNext,
  onLimitChange,
  cursorStackLen,
}: Props) {
  return (
    <div className="flex items-center justify-between py-2">
      <PageSizePicker value={limit} onChange={onLimitChange} />
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={onPrev}
          disabled={!canPrev || isLoading}
          aria-label="Previous page"
        >
          <ChevronsLeft />
        </Button>

        <span className="text-sm text-muted-foreground">
          {pagingMode === "offset"
            ? `Page ${page} of ${Math.max(totalPages, 1)}`
            : `Page ${cursorStackLen + 1}`}
        </span>

        <Button
          variant="default"
          size="icon"
          onClick={onNext}
          disabled={!canNext || isLoading}
          aria-label="Next page"
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
