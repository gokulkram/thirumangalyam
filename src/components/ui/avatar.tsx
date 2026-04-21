"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, getInitials } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-16 w-16 text-lg",
        xl: "h-24 w-24 text-2xl",
        "2xl": "h-32 w-32 text-3xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
  showOnline?: boolean;
}

function Avatar({ className, size, src, alt, name, showOnline, ...props }: AvatarProps) {
  return (
    <div className="relative inline-flex">
      <AvatarPrimitive.Root
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={alt || name || "User"}
          className="h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-primary-100 text-primary-700 font-semibold">
          {name ? getInitials(name) : "?"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {showOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-white" />
      )}
    </div>
  );
}

export { Avatar };
