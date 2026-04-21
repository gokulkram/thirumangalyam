"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string;
  formatValue?: (value: number) => string;
}

function Slider({ className, label, formatValue, value, defaultValue, ...props }: SliderProps) {
  const currentValue = value || defaultValue || [0];
  const displayMin = formatValue ? formatValue(currentValue[0]) : currentValue[0];
  const displayMax = currentValue.length > 1
    ? formatValue ? formatValue(currentValue[1]) : currentValue[1]
    : null;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-600">{label}</span>
          <span className="text-sm font-semibold text-primary-600">
            {displayMax !== null ? `${displayMin} – ${displayMax}` : displayMin}
          </span>
        </div>
      )}
      <SliderPrimitive.Root
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        value={value}
        defaultValue={defaultValue}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200">
          <SliderPrimitive.Range className="absolute h-full bg-primary-600" />
        </SliderPrimitive.Track>
        {currentValue.map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className="block h-5 w-5 rounded-full border-2 border-primary-600 bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 hover:bg-primary-50 cursor-grab active:cursor-grabbing"
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
}

export { Slider };
