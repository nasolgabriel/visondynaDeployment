import Aurora from "@/components/aurora";
import React from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark relative h-full w-full bg-slate-950">
      <div className="absolute top-0 h-full w-full rotate-180">
        <Aurora blend={1} amplitude={0.4} speed={0.4} />
      </div>
      {children}
    </div>
  );
}
