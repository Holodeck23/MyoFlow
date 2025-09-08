import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'encryption'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full font-medium transition-professional'
    
    const variants = {
      default: 'bg-neutral-gray-100 text-neutral-gray-800',
      secondary: 'bg-neutral-gray-100 text-neutral-gray-600',
      success: 'bg-green-100 text-green-800',
      danger: 'bg-austrian-red-100 text-austrian-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      encryption: 'bg-medical-blue-50 text-medical-blue-700 border border-medical-blue-200',
    }
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
    }
    
    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

// Encryption Badge Component
interface EncryptionBadgeProps {
  className?: string
  size?: 'sm' | 'md'
}

const EncryptionBadge = ({ className, size = 'sm' }: EncryptionBadgeProps) => (
  <Badge variant="encryption" size={size} className={className}>
    🔒 Verschlüsselt
  </Badge>
)

export { Badge, EncryptionBadge }