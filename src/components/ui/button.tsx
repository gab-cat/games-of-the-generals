import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Season 3 buttons: 6px corners, no shadows, a 40px default hit target,
// gold for the one primary action on a screen. See DESIGN.md.
const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // The one main action on a screen
        default:
          "bg-primary text-primary-foreground font-semibold hover:bg-[hsl(var(--primary-hover))]",
        // Everything else that needs a visible button
        secondary:
          "border border-border bg-white/[0.04] text-foreground hover:bg-white/[0.08] hover:border-border-strong",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-white/[0.06]",
        ghost: "text-foreground hover:bg-white/[0.06]",
        destructive:
          "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200",
        link: "h-auto px-0 text-gold-300 underline-offset-4 hover:underline active:scale-100",
        // Kept for old call sites; same as default
        gradient:
          "bg-primary text-primary-foreground font-semibold hover:bg-[hsl(var(--primary-hover))]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-[13px]",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
