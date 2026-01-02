import React from "react";
import type { ConversationSummary, UiMessage } from "@/lib/types";
import ConversationList from "./conversation-list";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import { Card } from "../ui/card";

export default function ChatContainer({
  conversations,
  activeConversation,
  messages,
  onSelectConversation,
  onSend,
}: {
  conversations: ConversationSummary[];
  activeConversation?: ConversationSummary | null;
  messages: UiMessage[]; // properly typed
  onSelectConversation: (id: string) => void;
  onSend: (text: string) => Promise<void>;
  onCreateConversation?: () => void;
  canCreate?: boolean;
}) {
  return (
    <Card className="flex h-36">
      <ConversationList
        conversations={conversations}
        activeId={activeConversation?.id ?? null}
        onSelect={onSelectConversation}
      />
      <div className="flex flex-1 flex-col">
        <MessageList messages={messages} />
        <MessageInput onSend={onSend} disabled={!activeConversation} />
      </div>
    </Card>
  );
}
