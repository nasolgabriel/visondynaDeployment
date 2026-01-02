// app/feed/FeedList.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Post from "@/components/post";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobStatus } from "@prisma/client";

type Job = {
  title: string;
  id: string;
  status: JobStatus;
  location: string;
  description: string;
  createdAt: Date;
  deletedAt?: Date | null;
  company: string;
  salary: number;
  manpower: number;
  categoryId: string;
  category: { name: string };
};

type JobsResponse = {
  ok: true;
  data: Job[];
  meta?: { nextCursor?: string | null; limit?: number };
};

const PAGE_SIZE = 10;

export default function FeedList({
  initialItems,
  initialCursor,
}: {
  initialItems: Job[];
  initialCursor: string | null;
}) {
  const [posts, setPosts] = useState<Job[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasNext, setHasNext] = useState<boolean>(Boolean(initialCursor));
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // stable refs to prevent duplicate fetches
  const cursorRef = useRef<string | null>(initialCursor);
  const hasNextRef = useRef<boolean>(Boolean(initialCursor));
  const fetchingRef = useRef<boolean>(false);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);

  useEffect(() => {
    fetchingRef.current = isFetching;
  }, [isFetching]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchNext = useCallback(async () => {
    if (!hasNextRef.current || fetchingRef.current) return;

    setIsFetching(true);
    setErrorMsg(null);

    try {
      const url = new URL("/api/jobs", window.location.origin);
      url.searchParams.set("limit", String(PAGE_SIZE));
      const cur = cursorRef.current;
      if (cur) url.searchParams.set("cursor", cur);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const json: JobsResponse = await res.json();

      const nextCursor = json.meta?.nextCursor ?? null;
      setPosts((prev) => [...prev, ...json.data]);
      setCursor(nextCursor);
      setHasNext(Boolean(nextCursor));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setIsFetching(false);
    }
  }, []);

  // observer (created once)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) fetchNext();
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNext]);

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}

      {/* sentinel */}
      <div ref={sentinelRef} className="h-1 w-full" />

      {isFetching && (
        <div className="py-4 text-center text-sm text-slate-400">
          Loading more…
        </div>
      )}

      {errorMsg && (
        <Card className="border-red-900 bg-red-950/40">
          <CardHeader>
            <CardTitle className="text-red-300">Couldn’t load more</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-200/80">{errorMsg}</p>
            <Button size="sm" variant="secondary" onClick={fetchNext}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasNext && posts.length > 0 && (
        <div className="py-4 text-center text-sm text-slate-500">
          You’re all caught up
        </div>
      )}
    </div>
  );
}
