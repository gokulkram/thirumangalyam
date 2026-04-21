import Link from "next/link";
import { cn } from "@/lib/utils";

interface CommunityTagProps {
  name: string;
  href?: string;
  active?: boolean;
}

export function CommunityTag({ name, href, active = false }: CommunityTagProps) {
  const classes = cn(
    "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
    active
      ? "bg-primary-600 text-white"
      : "bg-neutral-100 text-neutral-700 hover:bg-primary-50 hover:text-primary-700"
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {name}
      </Link>
    );
  }

  return <span className={classes}>{name}</span>;
}
