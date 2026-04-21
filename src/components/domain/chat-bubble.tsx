import { cn } from "@/lib/utils";
import { Check, CheckCheck, AlertCircle } from "lucide-react";
import type { ChatMessage } from "@/types";

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs text-neutral-500 text-center max-w-xs">
          {message.content}
        </span>
      </div>
    );
  }

  const time = new Date(message.sentAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5",
          isOwn
            ? "bg-primary-600 text-white rounded-br-md"
            : "bg-neutral-100 text-neutral-800 rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1",
            isOwn ? "text-white/60" : "text-neutral-400"
          )}
        >
          <span className="text-[10px]">{time}</span>
          {isOwn && (
            <>
              {message.status === "failed" && <AlertCircle className="h-3 w-3 text-red-300" />}
              {message.status === "sent" && <Check className="h-3 w-3" />}
              {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
              {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-300" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
