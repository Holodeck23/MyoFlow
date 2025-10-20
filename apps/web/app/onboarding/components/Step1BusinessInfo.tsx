// i18n: All user-facing text uses t('section.key', 'fallback')
'use client'

import { Button, Input } from '@/components/ui'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from '@myoflow/lib'
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
  const { t } = useTranslation()
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
          <h1 className="text-xl font-semibold text-slate-900">
            {t('onboarding.step1.title', 'Business Information')}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {t('onboarding.step1.description', 'Please confirm your practice address. This information will appear on invoices and documents.')}
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
              {t('onboarding.step1.labels.businessName', 'Practice Name')}
            </label>
            <Input
              id="businessName"
              autoComplete="organization"
              {...register('businessName', {
                required: t('onboarding.step1.errors.businessNameRequired', 'Practice name is required'),
                validate: (value) => value.trim().length > 0 || t('onboarding.step1.errors.businessNameRequired', 'Practice name is required'),
              })}
            />
            {errors.businessName && (
              <p className="text-sm text-red-600">{errors.businessName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="businessAddress" className="text-sm font-medium text-slate-800">
              {t('onboarding.step1.labels.businessAddress', 'Street and Number')}
            </label>
            <Input
              id="businessAddress"
              autoComplete="address-line1"
              placeholder={t('onboarding.step1.placeholders.businessAddress', 'Example: Main Street 12')}
              {...register('businessAddress', {
                required: t('onboarding.step1.errors.addressRequired', 'Address is required'),
                validate: (value) => {
                  const trimmed = value.trim()
                  if (!trimmed) {
                    return t('onboarding.step1.errors.addressRequired', 'Address is required')
                  }
                  if (trimmed === 'Hauptstraße 1') {
                    return t('onboarding.step1.errors.addressPlaceholder', 'Please enter your actual practice address')
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
                {t('onboarding.step1.labels.businessPostalCode', 'Postal Code')}
              </label>
              <Input
                id="businessPostalCode"
                inputMode="numeric"
                placeholder={t('onboarding.step1.placeholders.businessPostalCode', '1010')}
                {...register('businessPostalCode', {
                  required: t('onboarding.step1.errors.postalCodeRequired', 'Postal code is required'),
                  pattern: {
                    value: /^[1-9]\d{3}$/,
                    message: t('onboarding.step1.errors.postalCodeInvalid', 'Postal code must be a valid Austrian postal code (e.g. 1010, 4020)'),
                  },
                })}
              />
              {errors.businessPostalCode && (
                <p className="text-sm text-red-600">{errors.businessPostalCode.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="businessCity" className="text-sm font-medium text-slate-800">
                {t('onboarding.step1.labels.businessCity', 'City')}
              </label>
              <Input
                id="businessCity"
                autoComplete="address-level2"
                placeholder={t('onboarding.step1.placeholders.businessCity', 'City')}
                {...register('businessCity', {
                  required: t('onboarding.step1.errors.cityRequired', 'City is required'),
                  validate: (value) => value.trim().length > 0 || t('onboarding.step1.errors.cityRequired', 'City is required'),
                })}
              />
              {errors.businessCity && (
                <p className="text-sm text-red-600">{errors.businessCity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="businessCountry" className="text-sm font-medium text-slate-800">
              {t('onboarding.step1.labels.businessCountry', 'Country')}
            </label>
            <Input
              id="businessCountry"
              autoComplete="country-name"
              {...register('businessCountry', {
                required: t('onboarding.step1.errors.countryRequired', 'Country is required'),
                validate: (value) => value.trim().length > 0 || t('onboarding.step1.errors.countryRequired', 'Country is required'),
              })}
            />
            {errors.businessCountry && (
              <p className="text-sm text-red-600">{errors.businessCountry.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('onboarding.step1.buttons.saving', 'Saving...') : t('onboarding.step1.buttons.next', 'Next')}
          </Button>
        </div>
      </div>
    </form>
  )
}
