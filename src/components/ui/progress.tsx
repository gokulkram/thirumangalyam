"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

function Progress({ className, value = 0, label, showPercentage, size = "md", ...props }: ProgressProps) {
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className="flex flex-col gap-1.5">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold text-primary-600">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-neutral-200",
          heights[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full rounded-full bg-primary-600 transition-all duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

export { Progress };
