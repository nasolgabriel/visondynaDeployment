"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResendForm({ presetEmail }: { presetEmail: string }) {
  const [email, setEmail] = useState(presetEmail);
  const [loading, setLoading] = useState(false);

  async function onResend(e: React.FormEvent) {
    e.preventDefault();
    try {
      // simple email check client-side
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Please enter a valid email.");
        return;
      }
      setLoading(true);
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok && json?.ok) {
        toast.success("Verification email sent.");
      } else {
        toast.error(json?.error ?? "Failed to send email.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid grid-cols-[1fr_auto] gap-3" onSubmit={onResend}>
      <Input
        type="email"
        placeholder="you@example.com"
        className="bg-slate-950"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Resend link"}
      </Button>
    </form>
  );
}
