import Navbar from "@/components/navbar";
import React from "react";
import SessionWrapper from "@/components/session-wrapper";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-screen grid-rows-[4rem_1fr] bg-gradient-to-b from-slate-100 dark:from-slate-950 dark:to-slate-900">
      <SessionWrapper>
        <Navbar />
      </SessionWrapper>
      <div className="flex-1 overflow-y-scroll p-6">{children}</div>
    </div>
  );
}
