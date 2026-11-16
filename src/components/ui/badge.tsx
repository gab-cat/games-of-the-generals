import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium leading-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
  {
    variants: {
      variant: {
        default:
          "border-gold-500/30 bg-gold-500/10 text-gold-300",
        secondary:
          "border-border bg-white/[0.06] text-foreground",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-300",
        outline: "border-border-strong bg-transparent text-foreground",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
