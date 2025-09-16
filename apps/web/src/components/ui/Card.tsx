import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Austrian Medical Card Variants
const MedicalCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "patient" | "appointment" | "invoice" | "gdpr-compliant" | "kleinunternehmer"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "",
    patient: "border-l-4 border-l-[rgb(var(--info))] bg-blue-50/50",
    appointment: "border-l-4 border-l-[rgb(var(--success))] bg-green-50/50",
    invoice: "border-l-4 border-l-[rgb(var(--warning))] bg-amber-50/50",
    "gdpr-compliant": "border-l-4 border-l-[rgb(var(--gdpr-encrypted))] bg-green-50/30 shadow-[0_0_0_1px_rgb(var(--gdpr-encrypted)/0.1)]",
    "kleinunternehmer": "border-l-4 border-l-[rgb(var(--kleinunternehmer-progress))] bg-green-50/30"
  }

  return (
    <Card
      ref={ref}
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  )
})
MedicalCard.displayName = "MedicalCard"

// GDPR Compliance Indicator Card
const GDPRCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    status?: "encrypted" | "sensitive" | "audit" | "compliant"
    children: React.ReactNode
  }
>(({ className, status = "compliant", children, ...props }, ref) => {
  const statusClasses = {
    encrypted: "border-[rgb(var(--gdpr-encrypted))] bg-green-50/20 shadow-[0_0_0_1px_rgb(var(--gdpr-encrypted)/0.2)]",
    sensitive: "border-[rgb(var(--gdpr-sensitive))] bg-red-50/20 shadow-[0_0_0_1px_rgb(var(--gdpr-sensitive)/0.2)]",
    audit: "border-[rgb(var(--gdpr-audit))] bg-purple-50/20 shadow-[0_0_0_1px_rgb(var(--gdpr-audit)/0.2)]",
    compliant: "border-[rgb(var(--gdpr-compliant))] bg-green-50/20 shadow-[0_0_0_1px_rgb(var(--gdpr-compliant)/0.2)]"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border-2 bg-card text-card-foreground shadow-sm p-4",
        statusClasses[status],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
GDPRCard.displayName = "GDPRCard"

// Kleinunternehmer Progress Card
const KleinunternehmerCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    progress?: number // 0-100 percentage
    threshold?: number // €35,000 default
    current?: number // current revenue
  }
>(({ className, progress = 0, threshold = 35000, current = 0, ...props }, ref) => {
  const getProgressColor = () => {
    if (progress < 70) return "rgb(var(--kleinunternehmer-safe))"
    if (progress < 90) return "rgb(var(--kleinunternehmer-threshold))"
    return "rgb(var(--kleinunternehmer-warning))"
  }

  const getBorderColor = () => {
    if (progress < 70) return "border-[rgb(var(--kleinunternehmer-safe))]"
    if (progress < 90) return "border-[rgb(var(--kleinunternehmer-threshold))]"
    return "border-[rgb(var(--kleinunternehmer-warning))]"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border-2 bg-card text-card-foreground shadow-sm p-6",
        getBorderColor(),
        className
      )}
      {...props}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Kleinunternehmer Status</h3>
          <span className="text-sm text-muted-foreground">{progress}% of limit</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: getProgressColor()
            }}
          />
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>€{current.toLocaleString('de-AT')}</span>
          <span>€{threshold.toLocaleString('de-AT')} limit</span>
        </div>
      </div>
    </div>
  )
})
KleinunternehmerCard.displayName = "KleinunternehmerCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  MedicalCard,
  GDPRCard,
  KleinunternehmerCard
}