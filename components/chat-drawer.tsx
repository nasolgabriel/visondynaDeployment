"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Message = {
  id: number;
  sender: "HR" | "You";
  text: string;
  time: string;
};

export default function ChatDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "HR",
      text: "Hello, this is Visondyna HR. How can we help you?",
      time: "09:00 AM",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: messages.length + 1,
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="flex w-96 flex-col p-0">
        <SheetHeader className="border-b border-gray-200 p-4 dark:border-gray-700">
          <SheetTitle className="text-sm font-semibold">
            Chat with Visondyna HR
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "You" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                  msg.sender === "You"
                    ? "rounded-br-none bg-lime-600 text-white"
                    : "rounded-bl-none bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                {msg.text}
                <div className="mt-1 text-[10px] opacity-70">{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        <SheetFooter className="flex gap-2 border-t border-gray-200 p-2 dark:border-gray-700">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <Button
            onClick={sendMessage}
            size="sm"
            className="bg-lime-600 text-white"
          >
            Send
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
