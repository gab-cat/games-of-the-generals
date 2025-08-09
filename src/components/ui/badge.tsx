import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-blue-500/30 bg-blue-500/20 text-blue-300 shadow hover:bg-blue-500/30",
        secondary:
          "border-white/20 bg-white/10 text-white/80 hover:bg-white/20",
        destructive:
          "border-red-500/30 bg-red-500/20 text-red-300 shadow hover:bg-red-500/30",
        outline: "text-white/80 border-white/20 bg-white/5 hover:bg-white/10",
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
