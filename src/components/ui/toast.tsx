"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({ className, ...props }: ToastPrimitive.ToastViewportProps) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "fixed top-4 right-4 z-[600] flex max-w-sm flex-col gap-2",
        /* mobile: full-width top bar */
        "max-sm:top-0 max-sm:right-0 max-sm:left-0 max-sm:max-w-full max-sm:px-4 max-sm:pt-4",
        className
      )}
      {...props}
    />
  );
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: "border-l-success bg-success-light",
  error: "border-l-error bg-error-light",
  info: "border-l-info bg-info-light",
};

interface ToastProps extends ToastPrimitive.ToastProps {
  variant?: "success" | "error" | "info";
  title: string;
  description?: string;
}

function Toast({ className, variant = "info", title, description, ...props }: ToastProps) {
  const Icon = toastIcons[variant];

  return (
    <ToastPrimitive.Root
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-lg)] border border-neutral-200 border-l-[3px] p-4 shadow-lg bg-white",
        toastStyles[variant],
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=open]:fade-in",
        "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:fade-out",
        className
      )}
      {...props}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", {
        "text-success": variant === "success",
        "text-error": variant === "error",
        "text-info": variant === "info",
      })} />
      <div className="flex-1">
        <ToastPrimitive.Title className="text-sm font-semibold text-neutral-900">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="mt-0.5 text-xs text-neutral-600">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="shrink-0 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

export { ToastProvider, ToastViewport, Toast };
