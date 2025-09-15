import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "medical" | "plz" | "uid" | "iban"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "",
      medical: "border-[rgb(var(--info))] focus:border-[rgb(var(--success))] focus:ring-[rgb(var(--success))]",
      plz: "font-mono tracking-wider", // Austrian postal codes
      uid: "font-mono tracking-wider uppercase", // Austrian UID numbers
      iban: "font-mono tracking-wider uppercase", // Austrian IBAN format
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Austrian PLZ Input with validation pattern
const PLZInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "variant"> & { bundesland?: string }
>(({ className, bundesland, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      variant="plz"
      type="text"
      pattern="[0-9]{4}"
      maxLength={4}
      placeholder="1010"
      className={cn("w-24", className)}
      {...props}
    />
  )
})
PLZInput.displayName = "PLZInput"

// Austrian UID Input with validation
const UIDInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "variant">
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      variant="uid"
      type="text"
      pattern="ATU[0-9]{8}"
      maxLength={11}
      placeholder="ATU12345678"
      className={cn("w-40", className)}
      {...props}
    />
  )
})
UIDInput.displayName = "UIDInput"

// Austrian IBAN Input with validation
const IBANInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "variant">
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      variant="iban"
      type="text"
      pattern="AT[0-9]{2}[0-9]{4}[0-9]{12}"
      maxLength={20}
      placeholder="AT611904300234573201"
      className={cn("w-64", className)}
      {...props}
    />
  )
})
IBANInput.displayName = "IBANInput"

export { Input, PLZInput, UIDInput, IBANInput }