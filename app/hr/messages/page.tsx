"use client";

import React, { useMemo } from "react";
import { SessionProvider } from "next-auth/react";

import { useChat } from "@/lib/hooks/useChat";
import ConversationList from "@/components/chat/conversation-list";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import { Card } from "@/components/ui/card";

export default function HRMessagesPage() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    loadMessages,
    sendMessage,
  } = useChat();

  const active = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const handleSelect = async (id: string) => {
    setActiveConversationId(id);
    await loadMessages(id);
  };

  return (
    <SessionProvider>
      {/* full-height chat card */}
      <Card className="flex h-[calc(100vh-6rem)] w-full overflow-hidden bg-background/80">
        {/* Left: conversations sidebar */}
        <div className="flex h-full w-80 flex-col">
          <ConversationList
            conversations={conversations}
            activeId={active?.id ?? null}
            onSelect={handleSelect}
          />
        </div>

        <div className="flex h-full flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <MessageList messages={messages} />
          </div>

          <div className="border-t border-border bg-background/60">
            <MessageInput
              onSend={async (text) => {
                if (!active) return;
                await sendMessage(active.id, text);
              }}
              disabled={!active}
            />
          </div>
        </div>
      </Card>
    </SessionProvider>
  );
}
