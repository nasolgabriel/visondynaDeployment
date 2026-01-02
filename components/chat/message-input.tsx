import React, { useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

export default function MessageInput({
  onSend,
  disabled,
  placeholder,
}: {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!text.trim() || disabled || sending) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText("");
    } catch (err) {
      // Caller already handles toast; just log here
      console.error("MessageInput onSend error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-end gap-3 p-6">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={
          placeholder ??
          (disabled
            ? "Open a conversation first to send messages"
            : "Type a message...")
        }
        className="flex-1 resize-none rounded-md border-none bg-slate-100 p-4 text-sm focus-visible:ring-0 dark:bg-slate-900"
        disabled={disabled}
      />
      <Button
        onClick={submit}
        disabled={disabled || sending}
        className="bg-lime-500 text-white"
      >
        {sending ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}
