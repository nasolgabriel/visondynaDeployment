"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

function getInitials(n: Notification) {
  if (!n.message) return "";
  return n.message
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<Notification | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data: { notifications: Notification[] } = await res.json();
      setNotifications(
        (data.notifications ?? []).sort((a, b) => Number(a.isRead) - Number(b.isRead))
      );
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

  const toggleRead = async (id: string, read: boolean) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: read } : n));
      return updated.sort((a, b) => Number(a.isRead) - Number(b.isRead));
    });

    try {
      await fetch(`/api/notifications/${id}/${read ? "read" : "unread"}`, { method: "PATCH" });
    } catch (err) {
      console.error(err);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !read } : n)));
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    if (filter === "jobs") return n.type === "Job";
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
        <div className="flex gap-4">
          <Button onClick={fetchNotifications} variant="outline" size="sm">Refresh</Button>
          <Button onClick={markAllAsRead} variant="ghost" size="sm" className="text-lime-600 dark:text-lime-400">Mark all as read</Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="mb-4 rounded-md bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {filtered.length > 0 ? filtered.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 transition hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${notif.isRead ? "opacity-70" : ""}`}
                >
                  <Avatar className="h-10 w-10">
                    {notif.avatar ? <AvatarImage src={notif.avatar} /> : <AvatarFallback className="bg-lime-600 text-white font-semibold">{getInitials(notif)}</AvatarFallback>}
                  </Avatar>

                  <div className="flex-1" onClick={() => setModalData(notif)}>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.message}</p>
                    {notif.jobTitle && notif.company && (
                      <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{notif.jobTitle} — {notif.company} ({notif.location})</p>
                    )}
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="flex flex-col justify-between items-end">
                    <span className="text-xs font-medium text-lime-600 dark:text-lime-400">
                      {notif.isRead ? "Read" : "New"}
                    </span>
                    <span
                      className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline mt-1"
                      onClick={() => toggleRead(notif.id, !notif.isRead)}
                    >
                      {notif.isRead ? "Mark as unread" : "Mark as read"}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No notifications here</p>
                  <p className="mt-2 text-xs">Check back later for updates</p>
                </div>
              )}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Suggested for you</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Try applying to new jobs or updating your profile to get more recommendations.</p>
              <Link href="/jobs">
                <button className="w-full rounded-md bg-lime-600 px-3 py-2 text-sm font-medium text-white">Explore Jobs</button>
              </Link>
            </div>
          </aside>
        </div>
      )}

      <Dialog open={!!modalData} onOpenChange={() => setModalData(null)}>
        <DialogContent className="max-w-2xl rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogClose />
          </DialogHeader>
          {modalData && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  {modalData.avatar ? <AvatarImage src={modalData.avatar} /> : <AvatarFallback className="bg-lime-600 text-white font-semibold">{getInitials(modalData)}</AvatarFallback>}
                </Avatar>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{modalData.message}</p>
                  <Badge className={`mt-1 px-2 py-1 text-xs font-medium ${modalData.isRead ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300" : "bg-lime-600 text-white"}`}>
                    {modalData.isRead ? "Read" : "Unread"}
                  </Badge>
                </div>
              </div>

              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {modalData.jobTitle && <p><strong>Job:</strong> {modalData.jobTitle}</p>}
                {modalData.company && <p><strong>Company:</strong> {modalData.company}</p>}
                {modalData.location && <p><strong>Location:</strong> {modalData.location}</p>}
                <p><strong>Type:</strong> {modalData.type}</p>
                <p><strong>Status:</strong> {modalData.status}</p>
                <p><strong>Received:</strong> {new Date(modalData.createdAt).toLocaleString()}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={() => setModalData(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
