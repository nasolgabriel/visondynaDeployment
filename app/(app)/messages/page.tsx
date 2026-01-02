"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ChatHeader from "@/components/chat/chat-header";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import type { ConversationSummary, UiMessage } from "@/lib/types";
import { SessionProvider } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Single conversation applicant UI:
 * - No conversation list; applicants have exactly one conversation with HR.
 * - If a conversation exists it will be loaded; if none exists, the first send will create it.
 * - Applicant cannot create any more than 1 conversation.
 *
 * Enhancements in this version:
 * - Uses sonner toast instead of alerts
 * - Shows explicit "Start chat with HR" CTA above the input when no conversation exists
 * - Adds optimistic UI for sending messages (both for creating the conversation and for sending messages in an existing conversation)
 */

export default function ApplicantMessagesPage() {
  const [conversation, setConversation] = useState<ConversationSummary | null>(
    null,
  );
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingConvo, setLoadingConvo] = useState(true);
  const [, setLoadingMessages] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // Load applicant's conversation (if any)
  useEffect(() => {
    let mounted = true;
    async function loadConversations() {
      try {
        setLoadingConvo(true);
        const res = await fetch("/api/messages/conversations");
        const json = await res.json();
        if (!json.ok)
          throw new Error(json.error || "Failed to load conversations");
        const convos: ConversationSummary[] = json.data ?? [];
        const c = convos.length > 0 ? convos[0] : null;
        if (mounted) {
          setConversation(c);
        }
        if (c && mounted) {
          await loadMessages(c.id);
        }
      } catch (err) {
        console.error("loadConversations error:", err);
        toast.error("Could not load chat. Try refreshing.");
      } finally {
        if (mounted) setLoadingConvo(false);
      }
    }

    void loadConversations();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages for a conversation id
  const loadMessages = async (conversationId: string | null) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    try {
      setLoadingMessages(true);
      const res = await fetch(
        `/api/messages/conversations/${conversationId}/messages`,
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to load messages");
      const data = (json.data ?? []) as {
        id: string;
        senderRole: string;
        content: string;
        createdAt: string;
        readAt?: string | null;
      }[];
      const ui = data.map((m) => ({
        id: m.id,
        sender: m.senderRole,
        content: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: !!m.readAt,
      })) as UiMessage[];
      setMessages(ui);
    } catch (err) {
      console.error("loadMessages error:", err);
      toast.error("Could not load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Poll messages for active conversation every 3s
  useEffect(() => {
    if (pollIntervalId) {
      window.clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
    if (!conversation?.id) return;
    const id = window.setInterval(() => {
      void loadMessages(conversation.id);
    }, 3000);
    setPollIntervalId(id);
    return () => {
      window.clearInterval(id);
      setPollIntervalId(null);
    };
  }, [conversation?.id]);

  // Helper to append optimistic message
  const appendOptimisticMessage = (content: string, isFromUser = true) => {
    const tempId = `tmp-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const optimistic: UiMessage = {
      id: tempId,
      sender: isFromUser ? "APPLICANT" : "HR",
      content,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    return tempId;
  };

  // Replace optimistic message with authoritative list (when available)
  const replaceOptimisticMessages = (conversationId: string) => {
    // Load authoritative messages for the conversation
    return loadMessages(conversationId);
  };

  // Send handler: if no conversation exists, create one + message; otherwise just post message.
  const handleSend = async (text: string) => {
    if (!text || !text.trim()) return;
    setSending(true);
    try {
      // If conversation doesn't exist, create one by POSTing to conversations with initialMessage.
      if (!conversation) {
        // Optimistically append message in UI
        appendOptimisticMessage(text, true);

        // Create conversation and include initialMessage so server will attach the first message.
        const res = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initialMessage: text,
            subject: "Applicant → HR",
          }),
        });
        const json = await res.json();
        if (!json.ok) {
          // remove optimistic message on failure
          setMessages((prev) =>
            prev.filter((m) => !String(m.id).startsWith("tmp-")),
          );
          throw new Error(json.error || "Could not create conversation");
        }
        const created = json.data as ConversationSummary;
        setConversation(created);
        // Replace optimistic with authoritative messages
        await replaceOptimisticMessages(created.id);
        toast.success("Message sent.");
        return;
      }

      // existing conversation: optimistic append + POST
      const tempId = appendOptimisticMessage(text, true);

      const res = await fetch(
        `/api/messages/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        },
      );
      const json = await res.json();
      if (!json.ok) {
        // remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw new Error(json.error || "Failed to send message");
      }

      // On success, refresh authoritative messages (this replaces optimistic)
      await replaceOptimisticMessages(conversation.id);
      toast.success("Message sent.");
    } catch (err) {
      console.error("send error:", err);
      toast.error("Failed to send message. Please try again.");
      throw err;
    } finally {
      setSending(false);
    }
  };

  // Memoized header title / subtitle
  const headerTitle = useMemo(() => "Chat with HR", []);
  const headerSubtitle = useMemo(() => {
    if (conversation?.lastMessageAt)
      return new Date(conversation.lastMessageAt).toLocaleString();
    if (loadingConvo) return "Loading…";
    return "No conversation yet — send a message to start";
  }, [conversation?.lastMessageAt, loadingConvo]);

  return (
    <SessionProvider>
      <div className="p-6">
        <div className="mx-auto max-w-3xl">
          <Card>
            <ChatHeader title={headerTitle} subtitle={headerSubtitle} />
            <div className="flex h-[70vh] flex-col">
              <div className="flex-1 overflow-hidden">
                {loadingConvo && !conversation ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Loading chat…
                  </div>
                ) : (
                  <MessageList messages={messages} />
                )}
              </div>

              {/* CTA area */}
              <div className="px-3 py-2">
                {!conversation && (
                  <div className="mb-2 flex flex-col items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      You don&apos;t have an active chat with HR yet.
                    </div>
                    <Button
                      onClick={() => {
                        // focus input behavior: we simply show toast hint; actual send will create convo
                        toast(
                          "Type your message and press Send. This will create a chat with HR.",
                        );
                      }}
                      className="bg-lime-500 text-white"
                    >
                      Start chat with HR
                    </Button>
                  </div>
                )}

                <MessageInput
                  onSend={handleSend}
                  disabled={sending}
                  placeholder={
                    !conversation
                      ? "Type your message to HR to start conversation"
                      : "Type your message..."
                  }
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SessionProvider>
  );
}
