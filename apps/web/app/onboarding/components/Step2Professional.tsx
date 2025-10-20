// i18n: All user-facing text uses t('section.key', 'fallback')
'use client'

import { Button, Input } from '@/components/ui'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@myoflow/lib'
import type { UseFormReturn } from 'react-hook-form'
import type { WizardFormValues } from '../types'

interface Step2ProfessionalProps {
  form: UseFormReturn<WizardFormValues>
  onBack: () => void
  onNext: () => void
  isSubmitting: boolean
  submitError: string | null
}

export function Step2Professional({
  form,
  onBack,
  onNext,
  isSubmitting,
  submitError,
}: Step2ProfessionalProps) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  const DESIGNATION_OPTIONS = [
    { value: 'HEILMASSEUR', label: t('onboarding.step2.designations.heilmasseur', 'Remedial Masseur') },
    { value: 'MEDIZINISCHER_MASSEUR', label: t('onboarding.step2.designations.medizinischerMasseur', 'Medical Masseur') },
    { value: 'GEWERBLICHER_MASSEUR', label: t('onboarding.step2.designations.gewerblicherMasseur', 'Commercial Masseur') },
  ]

  const VAT_OPTIONS = [
    { value: 'KLEINUNTERNEHMER', label: t('onboarding.step2.vatOptions.kleinunternehmer', 'Small Business (§ 6 Abs. 1 Z 27 UStG)') },
    { value: 'UST_10', label: t('onboarding.step2.vatOptions.ust10', 'VAT 10% (e.g. remedial massage)') },
    { value: 'UST_13', label: t('onboarding.step2.vatOptions.ust13', 'VAT 13% (e.g. therapies)') },
    { value: 'UST_20', label: t('onboarding.step2.vatOptions.ust20', 'VAT 20% (standard)') },
  ]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
    >
      <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {t('onboarding.step2.title', 'Professional Details')}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {t('onboarding.step2.description', 'Select your professional designation and VAT classification.')}
            </p>
          </div>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="designation" className="text-sm font-medium text-slate-800">
              {t('onboarding.step2.labels.designation', 'Professional Designation')}
            </label>
            <select
              id="designation"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('designation', {
                required: t('onboarding.step2.errors.designationRequired', 'Please select a professional designation'),
              })}
            >
              {DESIGNATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.designation && (
              <p className="text-sm text-red-600">{errors.designation.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">
              {t('onboarding.step2.labels.vatStatus', 'VAT Status')}
            </p>
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              {VAT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent bg-white px-3 py-2 text-sm shadow-sm transition hover:border-blue-200 hover:shadow"
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="mt-1 h-4 w-4 text-blue-600"
                    {...register('vatStatus', {
                      required: t('onboarding.step2.errors.vatStatusRequired', 'Please select a VAT status'),
                    })}
                  />
                  <span className="text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.vatStatus && (
              <p className="text-sm text-red-600">{errors.vatStatus.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="chamberRegistration" className="text-sm font-medium text-slate-800">
              {t('onboarding.step2.labels.chamberRegistration', 'Chamber Registration (optional)')}
            </label>
            <Input
              id="chamberRegistration"
              placeholder="z. B. WKT-123456"
              {...register('chamberRegistration')}
            />
            <p className="text-xs text-slate-500">
              {t('onboarding.step2.labels.chamberHint', 'Will be displayed on invoices if provided.')}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="certificatesInput" className="text-sm font-medium text-slate-800">
              {t('onboarding.step2.labels.certificates', 'Certificates (optional)')}
            </label>
            <textarea
              id="certificatesInput"
              rows={4}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('onboarding.step2.labels.certificatesPlaceholder', 'Separate multiple certificates with line breaks')}
              {...register('certificatesInput')}
            />
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('onboarding.step2.buttons.back', 'Back')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('onboarding.step2.buttons.saving', 'Saving...') : t('onboarding.step2.buttons.next', 'Next')}
          </Button>
        </div>
      </div>
    </form>
  )
}
