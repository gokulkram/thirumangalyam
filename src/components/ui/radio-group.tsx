"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  label?: string;
  error?: string;
  options: { value: string; label: string; description?: string }[];
  layout?: "vertical" | "horizontal" | "cards";
}

function RadioGroup({
  className,
  label,
  error,
  options,
  layout = "vertical",
  ...props
}: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-neutral-600">{label}</span>}
      <RadioGroupPrimitive.Root
        className={cn(
          layout === "horizontal" && "flex flex-wrap gap-4",
          layout === "vertical" && "flex flex-col gap-2.5",
          layout === "cards" && "grid grid-cols-2 gap-3 sm:grid-cols-3",
          className
        )}
        {...props}
      >
        {options.map((option) =>
          layout === "cards" ? (
            <label
              key={option.value}
              className="relative flex cursor-pointer flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border-[1.5px] border-neutral-200 p-4 text-center transition-colors has-[data-state=checked]:border-primary-600 has-[data-state=checked]:bg-primary-50 hover:border-neutral-300"
            >
              <RadioGroupPrimitive.Item value={option.value} className="sr-only" />
              <span className="text-sm font-medium text-neutral-800">{option.label}</span>
              {option.description && (
                <span className="text-xs text-neutral-500">{option.description}</span>
              )}
            </label>
          ) : (
            <div key={option.value} className="flex items-center gap-2.5">
              <RadioGroupPrimitive.Item
                value={option.value}
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full border-[1.5px] border-neutral-300 bg-white transition-colors",
                  "data-[state=checked]:border-primary-600",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                )}
              >
                <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                </RadioGroupPrimitive.Indicator>
              </RadioGroupPrimitive.Item>
              <label className="text-sm text-neutral-700 cursor-pointer select-none">
                {option.label}
              </label>
            </div>
          )
        )}
      </RadioGroupPrimitive.Root>
      {error && <p className="text-xs text-error font-medium" role="alert">{error}</p>}
    </div>
  );
}

export { RadioGroup };
