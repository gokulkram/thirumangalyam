"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-600 text-white uppercase tracking-wider shadow-sm hover:bg-primary-700 hover:shadow-md hover:-translate-y-px active:bg-primary-800 active:translate-y-0 active:shadow-sm",
        secondary:
          "border-[1.5px] border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 hover:border-primary-700 active:bg-primary-100",
        ghost:
          "border-[1.5px] border-neutral-300 text-neutral-700 bg-transparent hover:bg-neutral-100 hover:border-neutral-400 active:bg-neutral-200",
        text: "text-primary-600 font-medium hover:text-primary-700 hover:underline active:text-primary-800 p-0",
        premium:
          "gold-gradient text-white shadow-[0_2px_8px_rgba(212,160,23,0.3)] hover:brightness-110 hover:shadow-[0_4px_12px_rgba(212,160,23,0.4)] active:brightness-95",
        destructive:
          "bg-error text-white hover:bg-red-700 active:bg-red-800",
      },
      size: {
        sm: "h-8 px-4 text-xs rounded-[var(--radius-md)]",
        md: "h-10 px-6 text-sm rounded-[var(--radius-md)]",
        lg: "h-12 px-8 text-base rounded-[var(--radius-md)]",
        icon: "h-10 w-10 rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, asChild = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
