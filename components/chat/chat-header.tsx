"use client";

import React, { useEffect, useState } from "react";

export default function ChatHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | null;
}) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // compute time on client only to avoid SSR/CSR mismatch
    const update = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    update();
    const t = window.setInterval(update, 60_000); // refresh every minute
    return () => window.clearInterval(t);
  }, []);

  return (
    <header className="flex items-end justify-between gap-4 border-b p-4 dark:border-slate-800">
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {subtitle && (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{time || "..."}</div>
    </header>
  );
}
