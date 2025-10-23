'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'
import type { Locale } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './Input'
import { useTranslation } from '@myoflow/lib'

type SupportedLocale = 'en' | 'de'

const localeMap: Record<SupportedLocale, Locale> = {
  en: enUS,
  de
}

function normalizeDate(date: Date) {
  return startOfDay(date)
}

function safeParseIso(value: string | null | undefined): Date | null {
  if (!value) return null
  try {
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

interface DatePickerFieldProps {
  id?: string
  name?: string
  value: string | null
  onChange: (value: string | null) => void
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  placeholder?: string
  required?: boolean
  error?: string | null
  onErrorChange?: (message: string | null) => void
  className?: string
  messages?: Partial<Record<'invalid' | 'beforeMin' | 'afterMax', string>>
}

export function DatePickerField({
  id,
  name,
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  placeholder,
  required,
  error,
  onErrorChange,
  className,
  messages
}: DatePickerFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { t, locale } = useTranslation()

  const localeKey: SupportedLocale = locale === 'de' ? 'de' : 'en'
  const localeConfig = localeMap[localeKey]
  const displayFormat = localeKey === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'
  const placeholderText = placeholder ?? (localeKey === 'de' ? 'TT.MM.JJJJ' : 'MM/DD/YYYY')

  const [inputValue, setInputValue] = useState<string>(() => {
    const parsed = safeParseIso(value)
    return parsed ? format(parsed, displayFormat, { locale: localeConfig }) : ''
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const parsed = safeParseIso(value)
    return parsed ? normalizeDate(parsed) : null
  })
  const [displayMonth, setDisplayMonth] = useState<Date>(() => selectedDate ?? new Date())
  const [open, setOpen] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)

  const minBoundary = useMemo(() => (minDate ? normalizeDate(minDate) : null), [minDate])
  const maxBoundary = useMemo(() => (maxDate ? normalizeDate(maxDate) : null), [maxDate])

  useEffect(() => {
    const parsed = safeParseIso(value)
    if (!parsed) {
      setSelectedDate(null)
      setInputValue('')
      return
    }
    const normalized = normalizeDate(parsed)
    setSelectedDate(normalized)
    setInputValue(format(normalized, displayFormat, { locale: localeConfig }))
    setDisplayMonth(normalized)
  }, [value, displayFormat, localeConfig])

  useEffect(() => {
    if (!open) return

    if (selectedDate) {
      setDisplayMonth(selectedDate)
    } else {
      setDisplayMonth(new Date())
    }
  }, [open, selectedDate])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(displayMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(displayMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [displayMonth])

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, index) => {
      const label = format(addDays(start, index), 'EEE', { locale: localeConfig })
      return label.replace('.', '')
    })
  }, [localeConfig])

  const emitError = useCallback((message: string | null) => {
    setInternalError(message)
    if (onErrorChange) {
      onErrorChange(message)
    }
  }, [onErrorChange])

  const parseInput = useCallback((raw: string): Date | null => {
    const trimmed = raw.trim()
    if (!trimmed) return null

    const patterns =
      localeKey === 'de'
        ? ['dd.MM.yyyy', 'd.M.yyyy', 'd.M.yy', 'yyyy-MM-dd']
        : ['MM/dd/yyyy', 'M/d/yyyy', 'yyyy-MM-dd', 'dd.MM.yyyy']

    for (const pattern of patterns) {
      const parsed = parse(trimmed, pattern, new Date(), { locale: localeConfig })
      if (isValid(parsed)) {
        return normalizeDate(parsed)
      }
    }

    const fallback = new Date(trimmed)
    if (isValid(fallback)) {
      return normalizeDate(fallback)
    }

    return null
  }, [localeConfig, localeKey])

  const commitInput = useCallback(() => {
    const trimmed = inputValue.trim()

    if (!trimmed) {
      emitError(null)
      setSelectedDate(null)
      onChange(null)
      return
    }

    const parsed = parseInput(trimmed)
    if (!parsed) {
      const message = messages?.invalid ?? t('datePicker.errors.invalid', 'Enter a valid date')
      emitError(message)
      return
    }

    if (minBoundary && isBefore(parsed, minBoundary)) {
      const message = messages?.beforeMin ?? t('datePicker.errors.beforeMin', 'Date is before the allowed range')
      emitError(message)
      return
    }

    if (maxBoundary && isAfter(parsed, maxBoundary)) {
      const message = messages?.afterMax ?? t('datePicker.errors.afterMax', 'Date cannot be in the future')
      emitError(message)
      return
    }

    emitError(null)
    setSelectedDate(parsed)
    setDisplayMonth(parsed)
    const formatted = format(parsed, displayFormat, { locale: localeConfig })
    setInputValue(formatted)
    onChange(format(parsed, 'yyyy-MM-dd'))
  }, [emitError, inputValue, parseInput, minBoundary, maxBoundary, t, displayFormat, localeConfig, onChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) {
        return
      }
      if (open) {
        setOpen(false)
      }
      commitInput()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [commitInput, open])

  const handleSelectDate = useCallback((day: Date) => {
    const normalized = normalizeDate(day)
    if (minBoundary && isBefore(normalized, minBoundary)) return
    if (maxBoundary && isAfter(normalized, maxBoundary)) return

    emitError(null)
    setSelectedDate(normalized)
    setInputValue(format(normalized, displayFormat, { locale: localeConfig }))
    onChange(format(normalized, 'yyyy-MM-dd'))
    setOpen(false)
  }, [displayFormat, emitError, localeConfig, maxBoundary, minBoundary, onChange])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
    if (internalError) {
      emitError(null)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitInput()
      setOpen(false)
    }
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' && !open) {
      setOpen(true)
    }
  }

  const errorMessage = error ?? internalError
  const today = useMemo(() => normalizeDate(new Date()), [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={disabled}
          required={required}
          autoComplete="off"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? `${id ?? name}-calendar` : undefined}
          aria-invalid={Boolean(errorMessage)}
          className={cn(errorMessage && 'border-red-500 focus:ring-red-200')}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 flex items-center text-slate-500 transition-colors hover:text-slate-700"
          onClick={() => {
            if (disabled) return
            setOpen((prev) => !prev)
          }}
          aria-label={t('datePicker.openCalendar', 'Open calendar')}
        >
          <CalendarIcon className="h-5 w-5" />
        </button>
      </div>

      {errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}

      {open && (
        <div
          id={`${id ?? name}-calendar`}
          role="dialog"
          aria-modal="false"
          className="absolute z-40 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <button
              type="button"
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setDisplayMonth((prev) => subMonths(prev, 1))}
              aria-label={t('datePicker.previousMonth', 'Previous month')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium text-slate-700">
              {format(displayMonth, 'LLLL yyyy', { locale: localeConfig })}
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setDisplayMonth((prev) => addMonths(prev, 1))}
              aria-label={t('datePicker.nextMonth', 'Next month')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-1 text-center text-xs font-medium uppercase text-slate-400">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const normalized = normalizeDate(day)
              const isDisabled = Boolean(
                (minBoundary && isBefore(normalized, minBoundary)) ||
                (maxBoundary && isAfter(normalized, maxBoundary))
              )
              const isSelected = selectedDate ? isSameDay(normalized, selectedDate) : false
              const isToday = isSameDay(normalized, today)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors',
                    !isSameMonth(day, displayMonth) && 'text-slate-300',
                    isDisabled && 'cursor-not-allowed text-slate-300',
                    !isSelected && !isDisabled && isSameMonth(day, displayMonth) && 'hover:bg-blue-50',
                    isSelected && 'bg-blue-600 text-white shadow-sm',
                    !isSelected && isToday && !isDisabled && 'border border-blue-500',
                    isDisabled && 'opacity-70'
                  )}
                  onClick={() => {
                    handleSelectDate(day)
                  }}
                  disabled={isDisabled}
                >
                  {format(day, 'd', { locale: localeConfig })}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
