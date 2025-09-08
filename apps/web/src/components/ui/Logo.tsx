import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
}

const Logo = ({ size = 'md', showTagline = false, className }: LogoProps) => {
  const sizes = {
    sm: {
      text: 'text-xl',
      hand: 'w-6 h-6',
      tagline: 'text-xs',
      container: 'space-y-1'
    },
    md: {
      text: 'text-2xl',
      hand: 'w-8 h-8',
      tagline: 'text-sm',
      container: 'space-y-2'
    },
    lg: {
      text: 'text-4xl',
      hand: 'w-12 h-12',
      tagline: 'text-base',
      container: 'space-y-3'
    }
  }

  const currentSize = sizes[size]

  return (
    <div className={cn('flex flex-col items-center', currentSize.container, className)}>
      <div className="flex items-center gap-2">
        <span className={cn(
          'font-bold tracking-tight text-medical-blue',
          currentSize.text
        )}>
          MyoFlow
        </span>
        <div className={cn(
          'flex items-center justify-center rounded-md bg-austrian-red text-white font-bold',
          currentSize.hand
        )}>
          <svg 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-3/4 h-3/4"
          >
            <path d="M12 2C10.9 2 10 2.9 10 4V8.5C10 9.3 10.7 10 11.5 10S13 9.3 13 8.5V4C13 2.9 12.1 2 12 2ZM16.5 3C15.7 3 15 3.7 15 4.5V8.5C15 9.3 15.7 10 16.5 10S18 9.3 18 8.5V4.5C18 3.7 17.3 3 16.5 3ZM7.5 5C6.7 5 6 5.7 6 6.5V8.5C6 9.3 6.7 10 7.5 10S9 9.3 9 8.5V6.5C9 5.7 8.3 5 7.5 5ZM20.5 6C19.7 6 19 6.7 19 7.5V8.5C19 9.3 19.7 10 20.5 10S22 9.3 22 8.5V7.5C22 6.7 21.3 6 20.5 6ZM12 11C8.1 11 5 12.3 5 16V18C5 19.7 6.3 21 8 21H16C17.7 21 19 19.7 19 18V16C19 12.3 15.9 11 12 11Z" />
          </svg>
        </div>
      </div>
      {showTagline && (
        <p className={cn(
          'text-neutral-gray-600 font-medium text-center',
          currentSize.tagline
        )}>
          Praxisverwaltung für Therapeuten
        </p>
      )}
    </div>
  )
}

export { Logo }