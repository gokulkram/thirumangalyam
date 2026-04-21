"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, charCount, maxLength, value, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-neutral-600">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "min-h-[100px] w-full rounded-[var(--radius-md)] border-[1.5px] border-neutral-300 bg-white px-4 py-3 text-base text-neutral-800 placeholder:text-neutral-400 transition-colors duration-150 resize-y",
            "focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100 focus:outline-none",
            error && "border-error focus:ring-error-light",
            "disabled:bg-neutral-100 disabled:text-neutral-400",
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          aria-invalid={!!error}
          {...props}
        />
        <div className="flex justify-between">
          {error ? (
            <p className="text-xs text-error font-medium" role="alert">{error}</p>
          ) : hint ? (
            <p className="text-xs text-neutral-500">{hint}</p>
          ) : (
            <span />
          )}
          {charCount && maxLength && (
            <p className={cn("text-xs", currentLength > maxLength * 0.9 ? "text-warning" : "text-neutral-400")}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
