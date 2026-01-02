import React from "react";
import type { ConversationSummary } from "@/lib/types";
import { formatDistanceStrict } from "date-fns";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-background/40">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">Messages</p>
        <Button size="icon" variant="outline">
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Scrollable list */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {conversations.length === 0 && (
            <p className="w-full px-1 pt-2 text-center text-xs text-muted-foreground">
              Your conversations will appear once someone sends a message.
            </p>
          )}

          {conversations.map((c) => {
            const name = c.applicant?.user
              ? `${c.applicant.user.firstname ?? ""} ${
                  c.applicant.user.lastname ?? ""
                }`.trim()
              : "Applicant";

            const active = activeId === c.id;

            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-lime-500/25 text-lime-500"
                    : "hover:bg-lime-600/20"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-500/10 text-xs font-semibold text-lime-400">
                  {name?.[0] ?? "A"}
                </div>

                <div className="flex flex-1 items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{name}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {c.subject ??
                        (c._count?.messages
                          ? `${c._count.messages} message${
                              c._count.messages === 1 ? "" : "s"
                            }`
                          : "No messages")}
                    </p>
                  </div>

                  <span className="shrink-0 text-[11px] text-slate-500">
                    {c.lastMessageAt
                      ? `${formatDistanceStrict(
                          c.lastMessageAt,
                          Date.now(),
                        )} ago`
                      : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
