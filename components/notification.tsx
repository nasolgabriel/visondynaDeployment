"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Notification = {
  id: string;
  message: string;
  type: "Job" | "Profile" | "Message";
  status: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  isRead: boolean;
  createdAt: string;
  avatar?: string;
};

export default function NotificationsPopover({ trigger }: { trigger?: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data: { notifications: Notification[] } = await res.json();

      // Sort: unread first, then read, newest first
      const sorted = (data.notifications ?? []).sort((a, b) => {
        if (a.isRead === b.isRead) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.isRead ? 1 : -1;
      });

      setNotifications(sorted.slice(0, 3));
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getInitials = (notif: Notification) => {
    const text = notif.company || notif.jobTitle || notif.message;
    const words = text.trim().split(" ");
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });

      setNotifications((prev) => {
        // Update the isRead locally
        const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));

        // Resort: unread first, read at the bottom
        return updated.sort((a, b) => {
          if (a.isRead === b.isRead) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isRead ? 1 : -1;
        });
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Popover>
      <PopoverTrigger>{trigger}</PopoverTrigger>

      <PopoverContent className="w-80 p-0 dark:bg-slate-900">
        {loading ? (
          <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </p>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No new notifications
          </p>
        ) : (
          <div className="max-h-96 divide-y overflow-y-auto dark:divide-slate-800">
            {notifications.map((notif) => {
              const date = new Date(notif.createdAt);
              const formattedDate = isNaN(date.getTime())
                ? "Unknown date"
                : date.toLocaleString();

              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    notif.isRead ? "bg-slate-100 dark:bg-slate-950/40" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {notif.avatar ? (
                      <AvatarImage src={notif.avatar} />
                    ) : (
                      <AvatarFallback className="bg-lime-600 text-white font-medium">
                        {getInitials(notif)}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1">
                    <p className="line-clamp-2 text-sm">{notif.message}</p>
                    <span className="text-xs text-slate-400">{formattedDate}</span>
                  </div>

                  {!notif.isRead && (
                    <span className="text-xs text-lime-600 dark:text-lime-400">New</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="w-full border-t dark:border-slate-800 p-2 text-center">
            <Link
              href="/notifications"
              className="text-sm text-slate-600 dark:text-slate-400 hover:underline"
            >
              View All Notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
