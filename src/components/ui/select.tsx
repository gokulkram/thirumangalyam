"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string; group?: string }[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

function Select({ label, error, placeholder, options, value, onValueChange, disabled }: SelectProps) {
  const groups = options.reduce<Record<string, { value: string; label: string }[]>>((acc, opt) => {
    const group = opt.group || "__default";
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-neutral-600">{label}</label>}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-[var(--radius-md)] border-[1.5px] border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-colors",
            "focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100 focus:outline-none",
            "disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed",
            "data-[placeholder]:text-neutral-400",
            error && "border-error"
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder || "Select..."} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="overflow-hidden rounded-[var(--radius-lg)] border border-neutral-200 bg-white shadow-lg z-50"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1 max-h-[300px]">
              {Object.entries(groups).map(([group, items]) =>
                group === "__default" ? (
                  items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectPrimitive.Group key={group}>
                    <SelectPrimitive.Label className="px-3 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {group}
                    </SelectPrimitive.Label>
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPrimitive.Group>
                )
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="text-xs text-error font-medium" role="alert">{error}</p>}
    </div>
  );
}

function SelectItem({ children, className, ...props }: SelectPrimitive.SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex items-center rounded-[var(--radius-md)] px-3 py-2 text-sm text-neutral-700 cursor-pointer select-none",
        "data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700 outline-none",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto">
        <Check className="h-4 w-4 text-primary-600" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { Select };
