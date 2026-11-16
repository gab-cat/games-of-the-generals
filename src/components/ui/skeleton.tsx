import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A placeholder block for dynamic data only. Size it like the real thing
 * (same height, width and radius) so nothing jumps when data arrives.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-white/[0.06]", className)}
      {...props}
    />
  );
}
