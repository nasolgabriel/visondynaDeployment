import { useEffect, useRef, useState, useCallback } from "react";
import type { ConversationSummary, ApiMessage, UiMessage } from "@/lib/types";

/**
 * useChat provides:
 *  - conversations: ConversationSummary[]
 *  - activeConversationId and setter
 *  - messages for active conversation
 *  - sendMessage(convoId, content)
 *  - createConversation(payload) (applicant creates for self, admin may pass applicantProfileId)
 *  - refresh functions
 *
 * Uses Next.js API endpoints:
 *  - GET /api/messages/conversations
 *  - POST /api/messages/conversations
 *  - GET /api/messages/conversations/:id/messages
 *  - POST /api/messages/conversations/:id/messages
 *  - POST /api/messages/conversations/:id/read
 */

export function useChat(pollInterval = 3000) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const pollRef = useRef<number | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      const json = await res.json();
      if (!json.ok)
        throw new Error(json?.error || "Failed to load conversations");
      setConversations(json.data as ConversationSummary[]);
      // if none active, pick first
      if (
        !activeConversationId &&
        Array.isArray(json.data) &&
        json.data.length > 0
      ) {
        setActiveConversationId((json.data as ConversationSummary[])[0].id);
      }
    } catch (err) {
      console.error("loadConversations error:", err);
    }
  }, [activeConversationId]);

  const loadMessages = useCallback(async (conversationId?: string) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/messages/conversations/${conversationId}/messages`,
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json?.error || "Failed to load messages");
      const data = json.data as ApiMessage[];
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
    }
  }, []);

  // polling for active conversation
  useEffect(() => {
    // clear previous poll
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!activeConversationId) return;
    // immediate load
    void loadMessages(activeConversationId);
    // poll
    pollRef.current = window.setInterval(() => {
      void loadMessages(activeConversationId);
    }, pollInterval);
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeConversationId, loadMessages, pollInterval]);

  useEffect(() => {
    // initial load of conversations
    void loadConversations();
  }, [loadConversations]);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!conversationId) throw new Error("No conversation selected");
      if (!content || !content.trim())
        throw new Error("Message content is empty");
      // optimistic append (temporary id)
      const tempId = `tmp-${Date.now()}`;
      const optimistic: UiMessage = {
        id: tempId,
        sender: "HR", // will be corrected on next poll/load based on real data
        content,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const res = await fetch(
          `/api/messages/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          },
        );
        const json = await res.json();
        if (!json.ok) throw new Error(json?.error || "Send failed");
        // reload messages for conversation to get authoritative list
        await loadMessages(conversationId);
        // update conversations list (lastMessageAt) -> reload convos
        await loadConversations();
        return json.data;
      } catch (err) {
        console.error("sendMessage error:", err);
        // remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw err;
      }
    },
    [loadMessages, loadConversations],
  );

  const createConversation = useCallback(
    async (payload: {
      subject?: string;
      initialMessage?: string;
      applicantProfileId?: string | null;
    }) => {
      try {
        const res = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.ok)
          throw new Error(json?.error || "Create conversation failed");
        // refresh convos and select the created convo
        await loadConversations();
        setActiveConversationId(json.data.id);
        return json.data as ConversationSummary;
      } catch (err) {
        console.error("createConversation error:", err);
        throw err;
      }
    },
    [loadConversations],
  );

  const markRead = useCallback(
    async (conversationId: string) => {
      try {
        await fetch(`/api/messages/conversations/${conversationId}/read`, {
          method: "POST",
        });
        // reload messages to get read states
        await loadMessages(conversationId);
      } catch (err) {
        console.error("markRead error:", err);
      }
    },
    [loadMessages],
  );

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    markRead,
  };
}
