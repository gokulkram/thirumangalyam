"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-neutral-200 bg-white p-4">
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full resize-none rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 pr-12 text-sm text-neutral-800",
            "placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "max-h-32 overflow-y-auto"
          )}
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
          message.trim()
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
        )}
        aria-label="Send message"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}
