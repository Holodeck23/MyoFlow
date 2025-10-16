import React, { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

type TooltipContent = {
  content: string
  example?: string
  note?: string
}

type TooltipContentMap = Record<string, TooltipContent>

const DEFAULT_CONTENT: TooltipContent = {
  content: 'Additional context is not available for this field yet.',
}

export const TOOLTIP_CONTENT: TooltipContentMap = {
  vatNumber: {
    content: 'Your Austrian VAT identification number (UID). Format: ATU########.',
    example: 'ATU12345678',
    note: 'Only required if you charge VAT.',
  },
  postalCode: {
    content: 'Austrian postal codes are four digits and start between 1 and 9.',
    example: '4020',
  },
  chamberId: {
    content: 'Your professional chamber registration number as issued by your Austrian province.',
    note: 'Typically a provincial prefix followed by digits, e.g. WKT1234.',
  },
  kleinunternehmer: {
    content: 'Small business tax exemption under §6(1)27 UStG.',
    note: 'Eligible if annual turnover stays below €35,000.',
  },
  rksvThreshold: {
    content: 'Registrierkassenpflicht applies once revenue exceeds €15,000 and cash transactions exceed €7,500 per year.',
  },
  iban: {
    content: 'Your Austrian bank account number used for payouts and invoices.',
    example: 'AT48 3200 0000 1234 5864',
  },
  logoUrl: {
    content: 'Company logo shown on invoices. PNG, JPG, SVG, or WebP recommended.',
    note: 'Use a secure https:// URL or upload in invoice branding settings.',
  },
}

export interface InfoTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  fieldKey?: keyof typeof TOOLTIP_CONTENT | string
  content?: string
  example?: string
  note?: string
  position?: TooltipPosition
  triggerClassName?: string
}

export function InfoTooltip({
  fieldKey,
  content,
  example,
  note,
  position = 'top',
  triggerClassName,
  className,
  ...rest
}: InfoTooltipProps) {
  const derivedContent = useMemo(() => {
    if (content || example || note) {
      return {
        content: content ?? '',
        example,
        note,
      }
    }

    if (!fieldKey) {
      return DEFAULT_CONTENT
    }

    return TOOLTIP_CONTENT[fieldKey] ?? DEFAULT_CONTENT
  }, [content, example, note, fieldKey])

  const tooltipPositionClass = useMemo(() => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2'
      case 'left':
        return 'right-full mr-3 top-1/2 -translate-y-1/2'
      case 'right':
        return 'left-full ml-3 top-1/2 -translate-y-1/2'
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2'
    }
  }, [position])

  const tooltipId = useMemo(() => `info-tooltip-${fieldKey ?? 'default'}`, [fieldKey])
  const [visible, setVisible] = useState(false)

  const show = () => setVisible(true)
  const hide = () => setVisible(false)

  return (
    <div className={cn('relative inline-flex items-center', className)} {...rest}>
      <button
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={visible ? tooltipId : undefined}
        className={cn(
          'flex items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          triggerClassName
        )}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>

      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-20 max-w-xs rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-xl',
            tooltipPositionClass
          )}
        >
          <p className="leading-snug">{derivedContent.content}</p>
          {derivedContent.example && (
            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-300">
              Example: {derivedContent.example}
            </p>
          )}
          {derivedContent.note && (
            <p className="mt-1 text-[11px] text-slate-300">{derivedContent.note}</p>
          )}
        </div>
      )}
    </div>
  )
}
