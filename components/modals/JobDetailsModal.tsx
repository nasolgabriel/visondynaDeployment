"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Building2, MapPin, Users } from "lucide-react";

export default function JobDetailsModal() {
  const progress = Math.min((10 / 50) * 100, 100);

  return (
    <Dialog defaultOpen={true}>
      <DialogOverlay className="fixed inset-0 z-40 bg-gray-400/40 backdrop-blur-sm" />

      <DialogContent className="z-50 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <DialogClose asChild>
          <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </DialogClose>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-lime-500">
            Title
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Posted 01/10/2025
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-lime-500" /> Visondyna
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-lime-500" /> Makati
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Job Description
            </h3>
            <p className="leading-relaxed text-gray-700">Job Description</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-lime-500" />
                Applicants
              </span>
              <span>10/10</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-lime-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Close
            </Button>
            <Button className="bg-lime-600 text-white hover:bg-lime-700">
              Apply Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
