'use client'

import React, { useState } from 'react'
import { Controller, type ControllerProps, type FieldValues } from 'react-hook-form'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from './Label'
import { InfoTooltip, type InfoTooltipProps } from './InfoTooltip'

type ValidationResult = string | null | undefined

type RenderParams<TFieldValues extends FieldValues> = Parameters<NonNullable<ControllerProps<TFieldValues>['render']>>[0]

type RenderInputFn<TFieldValues extends FieldValues> = (
  params: RenderParams<TFieldValues>
) => React.ReactNode

interface FormFieldProps<TFieldValues extends FieldValues> extends React.HTMLAttributes<HTMLDivElement> {
  name: ControllerProps<TFieldValues>['name']
  control: ControllerProps<TFieldValues>['control']
  label: string
  hint?: string
  tooltip?: InfoTooltipProps['fieldKey'] | InfoTooltipProps
  renderInput: RenderInputFn<TFieldValues>
  onBlurValidate?: (value: any) => ValidationResult
  successMessage?: string
  errorMessage?: string
}

export function FormField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  hint,
  tooltip,
  renderInput,
  onBlurValidate,
  className,
  successMessage = 'Looks good',
  errorMessage,
  ...rest
}: FormFieldProps<TFieldValues>) {
  const [touched, setTouched] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const { onBlur: containerOnBlur, ...containerRest } = rest

  return (
    <Controller
      name={name}
      control={control}
      render={(controllerRenderProps) => {
        const { field, fieldState, formState } = controllerRenderProps
        const hasFieldError = Boolean(fieldState.error)
        const effectiveError = manualError ?? fieldState.error?.message ?? errorMessage ?? null
        const showSuccess = touched && !effectiveError && Boolean(field.value)

        const handleBlur = (event: React.FocusEvent<any>) => {
          setTouched(true)
          if (onBlurValidate) {
            const validationResult = onBlurValidate(field.value)
            setManualError(validationResult ? String(validationResult) : null)
          }
          field.onBlur() // preserve react-hook-form onBlur
          containerOnBlur?.(event)
        }

        const tooltipProps = (() => {
          if (!tooltip) {
            return null
          }
          if (typeof tooltip === 'string') {
            return { fieldKey: tooltip }
          }
          return tooltip
        })()

        return (
          <div className={cn('flex flex-col gap-1.5', className)} {...containerRest}>
            <div className="flex items-center justify-between">
              <Label htmlFor={field.name} className="text-sm font-semibold text-slate-900">
                {label}
              </Label>
              {tooltipProps && <InfoTooltip {...tooltipProps} />}
            </div>

            {renderInput({
              field: {
                ...field,
                onBlur: handleBlur,
              },
              fieldState,
              formState,
            })}

            {hint && <p className="text-xs text-slate-500">{hint}</p>}

            {effectiveError && (
              <div className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{effectiveError}</span>
              </div>
            )}

            {showSuccess && (
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
