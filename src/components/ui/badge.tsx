import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "bull" | "bear" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        tone === "neutral" && "bg-raised text-muted",
        tone === "bull" && "bg-bull-dim text-bull",
        tone === "bear" && "bg-bear-dim text-bear",
        tone === "warn" && "bg-raised text-warn",
        className,
      )}
      {...props}
    />
  );
}
