"use client"

import { X } from "lucide-react"
import { useState } from "react"

interface Notification {
  id: number
  type: string
  message: string
  badge: { label: string; color: string }
  details?: string
  status?: "Pending" | "Success" | "Rejected"
  appointmentDate?: string
  requirements?: string[]
}

interface Props {
  open: boolean
  setOpen: (value: boolean) => void
  notification: Notification | null
}

export default function NotificationsModal({ open, setOpen, notification }: Props) {
  const [showDetails, setShowDetails] = useState(false)

  if (!open || !notification) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-scaleIn">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {notification.type}
        </h2>
        <p className="text-gray-600 mb-4">{notification.message}</p>

        {notification.details && (
          <p className="text-sm text-gray-700 mb-4">{notification.details}</p>
        )}

        {notification.status && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Application Status:
            </p>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                notification.status === "Success"
                  ? "bg-green-100 text-green-700"
                  : notification.status === "Rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {notification.status}
            </span>

            {notification.status === "Success" && (
              <div className="mt-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {showDetails ? "Hide Application Info" : "View Application Info"}
                </button>

                {showDetails && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900 font-semibold">
                      Appointment Date:
                    </p>
                    <p className="text-sm text-gray-600">
                      {notification.appointmentDate || "To be announced"}
                    </p>

                    <p className="mt-3 text-sm text-gray-900 font-semibold">
                      Requirements:
                    </p>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      {notification.requirements?.length ? (
                        notification.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))
                      ) : (
                        <li>No requirements listed</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
