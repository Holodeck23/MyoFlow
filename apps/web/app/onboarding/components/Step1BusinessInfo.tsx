'use client'

import { Button, Input } from '@/components/ui'
import { AlertCircle } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import type { WizardFormValues } from '../types'

interface Step1BusinessInfoProps {
  form: UseFormReturn<WizardFormValues>
  onNext: () => void
  isSubmitting: boolean
  submitError: string | null
}

export function Step1BusinessInfo({
  form,
  onNext,
  isSubmitting,
  submitError,
}: Step1BusinessInfoProps) {
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={(event) => {
      event.preventDefault()
      onNext()
    }}>
      <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Geschäftliche Informationen</h1>
          <p className="mt-2 text-sm text-slate-600">
            Bitte bestätigen Sie Ihre Praxisadresse. Diese Angaben erscheinen auf Rechnungen und
            Dokumenten.
          </p>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="businessName" className="text-sm font-medium text-slate-800">
              Praxisname
            </label>
            <Input
              id="businessName"
              autoComplete="organization"
              {...register('businessName', {
                required: 'Praxisname ist erforderlich',
                validate: (value) => value.trim().length > 0 || 'Praxisname ist erforderlich',
              })}
            />
            {errors.businessName && (
              <p className="text-sm text-red-600">{errors.businessName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="businessAddress" className="text-sm font-medium text-slate-800">
              Straße und Hausnummer
            </label>
            <Input
              id="businessAddress"
              autoComplete="address-line1"
              placeholder="Beispiel: Hauptstraße 12"
              {...register('businessAddress', {
                required: 'Adresse ist erforderlich',
                validate: (value) => {
                  const trimmed = value.trim()
                  if (!trimmed) {
                    return 'Adresse ist erforderlich'
                  }
                  if (trimmed === 'Hauptstraße 1') {
                    return 'Bitte geben Sie Ihre tatsächliche Praxisadresse ein'
                  }
                  return true
                },
              })}
            />
            {errors.businessAddress && (
              <p className="text-sm text-red-600">{errors.businessAddress.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <label htmlFor="businessPostalCode" className="text-sm font-medium text-slate-800">
                Postleitzahl
              </label>
              <Input
                id="businessPostalCode"
                inputMode="numeric"
                placeholder="1010"
                {...register('businessPostalCode', {
                  required: 'Postleitzahl ist erforderlich',
                  pattern: {
                    value: /^[1-9]\d{3}$/,
                    message: 'Postleitzahl muss eine gültige österreichische PLZ sein (z.B. 1010, 4020)',
                  },
                })}
              />
              {errors.businessPostalCode && (
                <p className="text-sm text-red-600">{errors.businessPostalCode.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="businessCity" className="text-sm font-medium text-slate-800">
                Stadt
              </label>
              <Input
                id="businessCity"
                autoComplete="address-level2"
                placeholder="Ort"
                {...register('businessCity', {
                  required: 'Ort ist erforderlich',
                  validate: (value) => value.trim().length > 0 || 'Ort ist erforderlich',
                })}
              />
              {errors.businessCity && (
                <p className="text-sm text-red-600">{errors.businessCity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="businessCountry" className="text-sm font-medium text-slate-800">
              Land
            </label>
            <Input
              id="businessCountry"
              autoComplete="country-name"
              {...register('businessCountry', {
                required: 'Land ist erforderlich',
                validate: (value) => value.trim().length > 0 || 'Land ist erforderlich',
              })}
            />
            {errors.businessCountry && (
              <p className="text-sm text-red-600">{errors.businessCountry.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Speichern...' : 'Weiter'}
          </Button>
        </div>
      </div>
    </form>
  )
}
