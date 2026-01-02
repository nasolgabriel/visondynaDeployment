import React, { useEffect, useRef } from "react";
import type { UiMessage } from "@/lib/types";
import { useSession } from "next-auth/react";

export default function MessageList({ messages }: { messages: UiMessage[] }) {
  const session = useSession();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  return (
    <div className="h-full flex-1 overflow-y-auto p-4" ref={scrollerRef}>
      <div className="flex flex-col gap-3">
        {messages.map((m) => {
          const isOwner = m.sender === session.data?.user.role;
          const isOptimistic = String(m.id).startsWith("tmp-");
          return (
            <div
              key={m.id}
              className={`flex ${isOwner ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-xl px-4 py-2 text-sm ${isOwner ? "bg-lime-600 text-white" : "bg-gray-100 text-gray-900 dark:bg-slate-900 dark:text-foreground"}`}
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="w-full break-all leading-5">{m.content}</p>
                  {isOptimistic && (
                    <div className="ml-2 text-[10px] opacity-60">Sending…</div>
                  )}
                </div>
                <div
                  className={`mt-1 ${isOwner ? "text-right text-lime-200" : "text-left text-slate-400"} text-[11px]`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
