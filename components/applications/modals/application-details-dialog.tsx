"use client";

import { useEffect, useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/utils";

type Props = {
  applicationId: string;
  onClose: () => void;
  onUpdated: () => void;
};

type ApplicationDetail = {
  id: string;
  status:
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "SHORTLISTED"
    | "INTERVIEWED"
    | "OFFERED"
    | "HIRED"
    | "REJECTED";
  submittedAt: string;
  formData: unknown;
  applicant: { id: string; name: string; email: string };
  job: { id: string; title: string; company: string; location: string };
};

const ENDPOINT = (id: string) => `/api/applications/${id}`;

const STATUS_COLORS: Record<ApplicationDetail["status"], string> = {
  SUBMITTED: "bg-gray-200 text-gray-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  SHORTLISTED: "bg-blue-100 text-blue-800",
  INTERVIEWED: "bg-indigo-100 text-indigo-800",
  OFFERED: "bg-purple-100 text-purple-800",
  HIRED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function ApplicationDetailsDialog({
  applicationId,
  onClose,
  onUpdated,
}: Props) {
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] =
    useState<ApplicationDetail["status"]>("SUBMITTED");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(ENDPOINT(applicationId));
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as { data: ApplicationDetail };
        if (cancelled) return;
        setData(json.data);
        setStatus(json.data.status);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load application."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  async function saveStatus() {
    if (!data) return;
    try {
      setSaving(true);

      // Update application status
      const res = await fetch(ENDPOINT(applicationId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());

      // Create notification using the already loaded data
      await fetch(`/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.applicant.id,
          message: `Your application for ${data.job.title} at ${data.job.company} has been updated to ${status}`,
          type: status,
          company: data.job.company,
          jobTitle: data.job.title,
          location: data.job.location,
          status: "UNREAD",
        }),
      });

      onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent className="bg-white shadow-xl rounded-lg p-6">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          Application Details
        </DialogTitle>
      </DialogHeader>

      {loading ? (
        <div className="space-y-3 p-2">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-56 animate-pulse rounded bg-gray-200" />
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : !data ? (
        <div className="text-sm text-gray-500">No data.</div>
      ) : (
        <div className="space-y-5">
          {/* Applicant Info */}
          <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-sm shadow-sm">
            <div className="font-medium text-gray-800">{data.applicant.name}</div>
            <div className="text-gray-600">{data.applicant.email}</div>
          </div>

          {/* Job Info */}
          <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-sm shadow-sm">
            <div className="font-medium text-gray-800">
              {data.job?.title ?? "N/A"} — {data.job?.company ?? "N/A"}
            </div>
            <div className="text-gray-600">{data.job?.location ?? "N/A"}</div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}
            >
              {toTitleCase(status)}
            </Badge>
            <div className="text-xs text-gray-500">
              Submitted {new Date(data.submittedAt).toLocaleString()}
            </div>
          </div>

          {/* Status Selector */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Update Status</div>
            <select
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as ApplicationDetail["status"])
              }
            >
              {[
                "SUBMITTED",
                "UNDER_REVIEW",
                "SHORTLISTED",
                "INTERVIEWED",
                "OFFERED",
                "HIRED",
                "REJECTED",
              ].map((s) => (
                <option key={s} value={s}>
                  {toTitleCase(s)}
                </option>
              ))}
            </select>
          </div>

          {/* Form Data */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Form Data</div>
            <pre className="max-h-[200px] overflow-auto rounded-md bg-gray-100 p-3 text-xs text-gray-800 border border-gray-200 shadow-sm">
              {JSON.stringify(data.formData, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveStatus} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
}
