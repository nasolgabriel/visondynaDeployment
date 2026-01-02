"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "./ui/input";
import { useSession } from "next-auth/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "./ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

const formSchema = z.object({
  coverLetter: z
    .string()
    .min(20, "Cover letter must be at least 20 characters")
    .max(2000, "Cover letter too long"),
});

type FormValues = z.infer<typeof formSchema>;

type ApplyJobDialogProps = {
  jobId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

type ExistingApplication = {
  id: string;
  status: string;
  submittedAt: string;
  formData?: { coverLetter?: string };
};

export default function ApplyJobDialog({
  jobId,
  open,
  onOpenChange,
}: ApplyJobDialogProps) {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { coverLetter: "" },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setExistingApp(null);

    (async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/apply`);
        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Please sign in to apply for this job");
            return;
          }
          throw new Error(await res.text());
        }
        const json = await res.json();
        if (!cancelled && json.ok && json.data) {
          setExistingApp(json.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load application status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, jobId]);

  async function onSubmit(values: FormValues) {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.status === 401) {
        toast.error("Please sign in to apply for this job");
        return;
      }

      const text = await res.text();
      if (!res.ok) {
        toast.error("Failed to submit application", { description: text });
        return;
      }

      const json = JSON.parse(text);
      if (json.ok && json.data) {
        toast.success("Application submitted successfully!");
        setExistingApp(json.data);
      } else {
        toast.error("Unexpected server response");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error", { description: "Please try again later" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-lg bg-slate-950 p-6 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl">Quick Application</DialogTitle>
          <DialogDescription className="w-full">
            Submit your application below to apply for the position. We’ll send
            your online profile automatically — just add a short cover letter to
            increase your chances of getting noticed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : existingApp ? (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>You’ve already applied for this position.</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>
                  Looks like you’ve already applied for this position — great
                  job taking that step! We’ll notify you when there’s an update
                  on your application status.
                </CardDescription>
                <CardDescription>
                  Your application{" "}
                  {existingApp.status === "REVIEWED" ? "has been" : "is"}{" "}
                  {existingApp.status.toLowerCase()}
                </CardDescription>

                <ScrollArea className="h-64 min-h-0">
                  <CardDescription className="whitespace-pre-line">
                    {existingApp.formData?.coverLetter}
                  </CardDescription>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <Label>Personal Information</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                defaultValue={session.data?.user.firstname}
                disabled
              />
              <Input
                type="text"
                defaultValue={session.data?.user.lastname}
                disabled
              />
            </div>
            <Input
              type="email"
              defaultValue={session.data?.user.email || ""}
              disabled
            />

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Controller
                name="coverLetter"
                control={form.control}
                render={({ field }) => (
                  <InputGroup>
                    <InputGroupTextarea
                      id="coverLetter"
                      placeholder="Add a short note to stand out — share your skills, experience, or motivation for applying."
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className="min-h-80"
                    />
                    <InputGroupAddon align="block-end">
                      <div className="flex w-full items-center justify-end gap-2">
                        <p className="text-xs text-muted-foreground">
                          {field.value.length}/2000
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => onOpenChange(false)}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-lime-500 text-white"
                          disabled={submitting}
                        >
                          {submitting ? "Submitting" : "Submit Application"}
                        </Button>
                      </div>
                    </InputGroupAddon>
                  </InputGroup>
                )}
              />
              {form.formState.errors.coverLetter && (
                <p className="text-xs text-red-400">
                  {form.formState.errors.coverLetter.message}
                </p>
              )}
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
