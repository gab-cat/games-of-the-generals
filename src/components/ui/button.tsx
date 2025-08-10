import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center rounded-full justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "bg-white rounded-full text-black hover:bg-gray-100 text-white shadow-lg hover:shadow-xl",
        destructive:
          "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 shadow-lg hover:shadow-xl",
        outline:
          "border rounded-full border-white/20 bg-white/10 hover:bg-white/20 text-white/90 shadow-lg hover:shadow-xl",
        secondary:
          "bg-transparent rounded-full hover:bg-white/10 text-white/80 border border-white/20 shadow-lg hover:shadow-xl",
        ghost: "hover:bg-white/10 text-white/90",
        link: "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
        gradient: "bg-gradient-to-r rounded-full text-white from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
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

export { Button }
