import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "white";
}

export function Logo({ className, variant = "default" }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 group", className)}
    >
      {/* Kolam-inspired icon mark */}
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          variant === "default" ? "bg-primary-600" : "bg-white/20"
        )}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(variant === "default" ? "text-white" : "text-white")}
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            "text-lg font-bold leading-tight tracking-tight",
            variant === "default" ? "text-neutral-900" : "text-white"
          )}
        >
          Thirumangalyam
        </span>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.15em] leading-none",
            variant === "default" ? "text-neutral-500" : "text-white/70"
          )}
        >
          South Indian Matrimony
        </span>
      </div>
    </Link>
  );
}
