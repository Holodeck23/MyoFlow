import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Austrian Medical Blue primary buttons
        default: "bg-[#1565C0] text-white shadow hover:bg-[#C8102E]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background text-foreground shadow-sm hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E] transition-colors duration-200",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-[#C8102E] hover:text-white",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Austrian Red accent variant for important actions
        accent: "bg-accent text-accent-foreground shadow hover:bg-accent/90",
        // Medical success variant for positive actions
        success: "bg-[rgb(var(--success))] text-[rgb(var(--success-foreground))] shadow hover:bg-[rgb(var(--success))]/90",
        // Medical warning variant for caution actions
        warning: "bg-[rgb(var(--warning))] text-[rgb(var(--warning-foreground))] shadow hover:bg-[rgb(var(--warning))]/90",
        // Medical info variant for informational actions
        info: "bg-[rgb(var(--info))] text-[rgb(var(--info-foreground))] shadow hover:bg-[rgb(var(--info))]/90",
        // GDPR compliance variants
        "gdpr-encrypted": "bg-[rgb(var(--gdpr-encrypted))] text-white shadow hover:bg-[rgb(var(--gdpr-encrypted))]/90",
        "gdpr-audit": "bg-[rgb(var(--gdpr-audit))] text-white shadow hover:bg-[rgb(var(--gdpr-audit))]/90",
        // Kleinunternehmer tracking variants
        "ku-progress": "bg-[rgb(var(--kleinunternehmer-progress))] text-white shadow hover:bg-[rgb(var(--kleinunternehmer-progress))]/90",
        "ku-threshold": "bg-[rgb(var(--kleinunternehmer-threshold))] text-white shadow hover:bg-[rgb(var(--kleinunternehmer-threshold))]/90",
        "ku-warning": "bg-[rgb(var(--kleinunternehmer-warning))] text-white shadow hover:bg-[rgb(var(--kleinunternehmer-warning))]/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
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

export { Button, buttonVariants }