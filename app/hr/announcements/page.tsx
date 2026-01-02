"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Megaphone } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

type Announcement = {
  id: string
  title: string
  message: string
  date: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "Team Building Event",
      message:
        "We’re hosting a team-building activity this Friday! Meet at the HR lobby by 9:00 AM. Food and fun guaranteed!",
      date: "2025-10-22",
    },
    {
      id: "2",
      title: "New Employee Orientation",
      message:
        "Please welcome our new batch of employees joining the company this week. Orientation will be held in the conference room at 10:00 AM.",
      date: "2025-10-18",
    },
  ])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, title, message } : a))
      )
    } else {
      const newAnnouncement = {
        id: Date.now().toString(),
        title,
        message,
        date: new Date().toISOString().split("T")[0],
      }
      setAnnouncements((prev) => [newAnnouncement, ...prev])
    }

    setTitle("")
    setMessage("")
    setEditing(null)
    setOpen(false)
  }

  const handleEdit = (a: Announcement) => {
    setEditing(a)
    setTitle(a.title)
    setMessage(a.message)
    setOpen(true)
  }

  const handleDelete = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="min-h-screen space-y-6 animate-in fade-in duration-300">
      <Card className="border border-border bg-card/90 backdrop-blur-md">
        <CardHeader className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="text-lime-500 h-5 w-5" />
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
              Announcements
            </CardTitle>
          </div>
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            className="flex items-center gap-2 border-lime-500/40 text-lime-500 hover:bg-lime-500/10"
          >
            <Plus size={16} /> New
          </Button>
        </CardHeader>

        <Separator className="bg-border" />

        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 py-6">
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border/60 bg-muted/10 p-4 flex flex-col justify-between hover:bg-muted/20 transition"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {a.message}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{a.date}</span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-blue-400 hover:bg-blue-500/10"
                      onClick={() => handleEdit(a)}
                    >
                      <Edit size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground col-span-full py-10">
              No announcements yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-xl border border-border bg-card/95 p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border bg-muted/10">
            <DialogTitle className="text-base font-semibold">
              {editing ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter announcement message..."
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                className="border-lime-500/40 text-lime-500 hover:bg-lime-500/10"
              >
                {editing ? "Save Changes" : "Post Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
