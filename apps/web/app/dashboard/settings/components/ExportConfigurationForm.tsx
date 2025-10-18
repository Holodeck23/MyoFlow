'use client'

import React, { useMemo } from 'react'
import { Controller, useForm, type UseFormClearErrors, type UseFormSetError } from 'react-hook-form'
import { Button, Input, Label } from '@/components/ui'
import {
  accountingExportRequestSchema,
  type AccountingExportRequest
} from '@/lib/accounting-exports'
import { cn } from '@/lib/utils'
import { getPreviousMonthRange } from './accounting-export-utils'

const STATUS_OPTIONS = ['SENT', 'PAID'] as const
type StatusOption = typeof STATUS_OPTIONS[number]

const formSchema = accountingExportRequestSchema.superRefine((data, ctx) => {
  if (!data.statusFilter || data.statusFilter.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['statusFilter'],
      message: 'Please select at least one invoice status (SENT or PAID)'
    })
  }

  const start = new Date(data.dateRangeStart)
  const end = new Date(data.dateRangeEnd)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    ctx.addIssue({
      code: 'custom',
      path: ['dateRangeStart'],
      message: 'Please enter a valid date range'
    })
    return
  }

  if (end < start) {
    ctx.addIssue({
      code: 'custom',
      path: ['dateRangeEnd'],
      message: 'End date must be after start date'
    })
  }
})

export type ExportConfigurationFormData = AccountingExportRequest

interface ExportConfigurationFormProps {
  onPreview: (payload: ExportConfigurationFormData) => Promise<void> | void
  onGenerate: (payload: ExportConfigurationFormData) => Promise<void> | void
  isPreviewLoading?: boolean
  isGenerateLoading?: boolean
  errorMessage?: string | null
  infoMessage?: string | null
}

export function ExportConfigurationForm({
  onPreview,
  onGenerate,
  isPreviewLoading,
  isGenerateLoading,
  errorMessage,
  infoMessage
}: ExportConfigurationFormProps) {
  const defaultRange = useMemo(() => getPreviousMonthRange(), [])

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<ExportConfigurationFormData>({
    defaultValues: {
      targetSystem: 'BMD',
      dateRangeStart: defaultRange.start,
      dateRangeEnd: defaultRange.end,
      statusFilter: STATUS_OPTIONS.slice() as StatusOption[],
      options: {
        separator: ';',
        dateFormat: 'dd.MM.yyyy',
        includeHeader: true
      }
    }
  })

  const targetSystem = watch('targetSystem')

  const submitPreview = handleSubmit(async values => {
    const parsed = validateForm(values, setError, clearErrors)
    if (!parsed) return
    await onPreview(sanitizePayload(parsed))
  })

  const submitGenerate = handleSubmit(async values => {
    const parsed = validateForm(values, setError, clearErrors)
    if (!parsed) return
    await onGenerate(sanitizePayload(parsed))
  })

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Accounting Exports</h2>
        <p className="text-sm text-slate-600">
          Generate CSV exports for Austrian accounting systems. Choose the target
          system, date range, and invoice status to include in the export.
        </p>
      </div>

      <form className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="targetSystem">Target System</Label>
            <select
              id="targetSystem"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              {...register('targetSystem')}
            >
              <option value="BMD">BMD (Austria)</option>
              <option value="RZL">RZL (Austria)</option>
              <option value="DATEV">DATEV (Germany/Austria)</option>
              <option value="CSV_GENERIC">Generic CSV</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="includeHeader">Include CSV Header</Label>
            <Controller
              control={control}
              name="options.includeHeader"
              render={({ field }) => (
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    id="includeHeader"
                    type="checkbox"
                    checked={field.value ?? true}
                    onChange={event => field.onChange(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Include column headers in export
                </label>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dateRangeStart">Start Date</Label>
            <Controller
              control={control}
              name="dateRangeStart"
              render={({ field }) => (
                <input
                  id="dateRangeStart"
                  type="date"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              )}
            />
            {errors.dateRangeStart && (
              <p className="text-xs text-red-600">{errors.dateRangeStart.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dateRangeEnd">End Date</Label>
            <Controller
              control={control}
              name="dateRangeEnd"
              render={({ field }) => (
                <input
                  id="dateRangeEnd"
                  type="date"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              )}
            />
            {errors.dateRangeEnd && (
              <p className="text-xs text-red-600">{errors.dateRangeEnd.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Invoice Status</Label>
          <Controller
            control={control}
            name="statusFilter"
            render={({ field }) => (
              <div className="flex flex-wrap gap-4">
                {STATUS_OPTIONS.map(option => {
                  const checked = field.value?.includes(option) ?? false
                  return (
                    <label
                      key={option}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition',
                        checked
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-blue-200'
                      )}
                    >
                      <input
                        type="checkbox"
                        value={option}
                        checked={checked}
                        onChange={event => {
                          const isChecked = event.target.checked
                          const current = field.value ?? []
                          const next = isChecked
                            ? Array.from(new Set([...current, option]))
                            : current.filter(status => status !== option)
                          field.onChange(next)
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {option === 'SENT' ? 'Sent' : 'Paid'}
                    </label>
                  )
                })}
              </div>
            )}
          />
          {errors.statusFilter && (
            <p className="text-xs text-red-600">{errors.statusFilter.message}</p>
          )}
        </div>

        {targetSystem === 'DATEV' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="consultantNumber">Consultant Number</Label>
              <Input
                id="consultantNumber"
                placeholder="Tax consultant number (optional)"
                {...register('options.consultantNumber')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientNumber">Client Number</Label>
              <Input
                id="clientNumber"
                placeholder="Client number (optional)"
                {...register('options.clientNumber')}
              />
            </div>
          </div>
        )}

        {targetSystem === 'CSV_GENERIC' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="separator">Separator</Label>
              <select
                id="separator"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                {...register('options.separator')}
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <select
                id="dateFormat"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                {...register('options.dateFormat')}
              >
                <option value="dd.MM.yyyy">dd.MM.yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              </select>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {infoMessage && !errorMessage && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {infoMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={submitPreview}
            disabled={isPreviewLoading}
          >
            {isPreviewLoading ? 'Preparing preview…' : 'Preview Export'}
          </Button>
          <Button type="button" onClick={submitGenerate} disabled={isGenerateLoading}>
            {isGenerateLoading ? 'Generating…' : 'Generate & Download'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function sanitizePayload(values: ExportConfigurationFormData): ExportConfigurationFormData {
  const statusFilterArray = (values.statusFilter ?? STATUS_OPTIONS) as StatusOption[]
  const statusFilter = Array.from(new Set(statusFilterArray)) as StatusOption[]
  const options = { ...(values.options ?? {}) }

  if (values.targetSystem !== 'DATEV') {
    delete options.consultantNumber
    delete options.clientNumber
  }

  if (values.targetSystem !== 'CSV_GENERIC') {
    delete options.separator
    delete options.dateFormat
  }

  if (values.targetSystem !== 'BMD') {
    delete options.accountCode
    delete options.taxCode
  }

  const sanitized: ExportConfigurationFormData = {
    ...values,
    statusFilter
  }

  if (Object.keys(options).length > 0) {
    sanitized.options = options
  } else {
    delete (sanitized as any).options
  }

  return sanitized
}

function validateForm(
  values: ExportConfigurationFormData,
  setError: UseFormSetError<ExportConfigurationFormData>,
  clearErrors: UseFormClearErrors<ExportConfigurationFormData>
): ExportConfigurationFormData | null {
  clearErrors()
  const parsed = formSchema.safeParse(values)

  if (parsed.success) {
    return parsed.data
  }

  const flattened = parsed.error.flatten()

  Object.entries(flattened.fieldErrors).forEach(([field, messages]) => {
    if (messages && messages.length > 0) {
      setError(field as any, { type: 'manual', message: messages[0] })
    }
  })

  if (flattened.formErrors.length > 0) {
    setError('dateRangeStart' as any, { type: 'manual', message: flattened.formErrors[0] })
  }

  return null
}
