import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  encrypted?: boolean
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, encrypted = false, label, error, ...props }, ref) => {
    const inputId = props.id || props.name

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-gray-700 flex items-center gap-2"
          >
            {label}
            {encrypted && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-medical-blue-50 text-medical-blue-700 border border-medical-blue-200">
                🔒 Verschlüsselt gespeichert
              </span>
            )}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-neutral-gray-500 focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-professional',
            error && 'border-austrian-red-500 focus:ring-austrian-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-austrian-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }