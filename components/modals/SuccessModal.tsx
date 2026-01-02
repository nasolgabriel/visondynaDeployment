"use client"

import { Button } from "@/components/ui/button"
import { X, CheckCircle } from "lucide-react"

interface Props {
  open: boolean
  setOpen: (value: boolean) => void
}

export default function SuccessModal({ open, setOpen }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-scaleIn">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Application Successful
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Your application has been submitted. We’ll review your details and get back to you soon.
          </p>
          <Button
            onClick={() => setOpen(false)}
            className="px-6 bg-lime-500 text-white hover:bg-lime-600"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
