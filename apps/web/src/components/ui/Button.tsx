import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, asChild = false, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-professional focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-medical-blue text-white hover:bg-medical-blue-700 focus:ring-medical-blue-500 shadow-card hover:shadow-card-hover',
      secondary: 'bg-neutral-gray-100 text-neutral-gray-700 hover:bg-neutral-gray-200 focus:ring-neutral-gray-500',
      outline: 'border border-border text-neutral-gray-700 bg-white hover:bg-neutral-gray-50 focus:ring-medical-blue-500',
      ghost: 'text-neutral-gray-700 hover:bg-neutral-gray-100 focus:ring-medical-blue-500',
      danger: 'bg-austrian-red text-white hover:bg-austrian-red-700 focus:ring-austrian-red-500 shadow-card hover:shadow-card-hover',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }
    
    const buttonClasses = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      className
    )
    
    if (asChild) {
      // When asChild is true, we apply the styling to the child element
      return (
        <span className={buttonClasses}>
          {children}
        </span>
      )
    }
    
    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }