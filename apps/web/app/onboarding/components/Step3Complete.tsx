// i18n: All user-facing text uses t('section.key', 'fallback')
'use client'

import { Button } from '@/components/ui'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@myoflow/lib'
import type { UseFormReturn } from 'react-hook-form'
import type { WizardFormValues } from '../types'

interface Step3CompleteProps {
  form: UseFormReturn<WizardFormValues>
  onBack: () => void
  onFinish: () => void
  profileScore: number | null
}

export function Step3Complete({ form, onBack, onFinish, profileScore }: Step3CompleteProps) {
  const { t } = useTranslation()
  const values = form.getValues()
  const certificates = values.certificatesInput
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  return (
    <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-emerald-200">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {t('onboarding.step3.title', 'Your profile is ready!')}
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          {t('onboarding.step3.description', 'Thank you. We have saved all important information. You can now use the dashboard and adjust further settings later.')}
        </p>
        {typeof profileScore === 'number' && (
          <p className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {t('onboarding.step3.profileScore', 'Profile Score: {score}').replace('{score}', String(profileScore))}
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('onboarding.step3.summary.title', 'Summary')}
        </h2>
        <dl className="space-y-3 text-sm text-slate-700">
          <div>
            <dt className="font-medium text-slate-600">
              {t('onboarding.step3.summary.businessName', 'Practice Name')}
            </dt>
            <dd className="text-slate-900">{values.businessName || t('onboarding.step3.summary.noValue', '—')}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">
              {t('onboarding.step3.summary.address', 'Address')}
            </dt>
            <dd className="text-slate-900">
              {values.businessAddress || t('onboarding.step3.summary.noValue', '—')}
              <br />
              {values.businessPostalCode && values.businessCity
                ? `${values.businessPostalCode} ${values.businessCity}`
                : t('onboarding.step3.summary.noValue', '—')}
              <br />
              {values.businessCountry || t('onboarding.step3.summary.noValue', '—')}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">
              {t('onboarding.step3.summary.designation', 'Professional Designation')}
            </dt>
            <dd className="text-slate-900">{values.designation || t('onboarding.step3.summary.noValue', '—')}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">
              {t('onboarding.step3.summary.vatStatus', 'VAT Status')}
            </dt>
            <dd className="text-slate-900">{values.vatStatus || t('onboarding.step3.summary.noValue', '—')}</dd>
          </div>
          {values.chamberRegistration && (
            <div>
              <dt className="font-medium text-slate-600">
                {t('onboarding.step3.summary.chamberRegistration', 'Chamber Registration')}
              </dt>
              <dd className="text-slate-900">{values.chamberRegistration}</dd>
            </div>
          )}
          {certificates.length > 0 && (
            <div>
              <dt className="font-medium text-slate-600">
                {t('onboarding.step3.summary.certificates', 'Certificates')}
              </dt>
              <dd className="mt-1 space-y-1">
                {certificates.map((entry) => (
                  <div key={entry} className="rounded-md bg-white px-3 py-1 text-slate-800 shadow-sm">
                    {entry}
                  </div>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('onboarding.step3.buttons.back', 'Back')}
        </Button>
        <Button type="button" onClick={onFinish}>
          {t('onboarding.step3.buttons.finish', 'To Dashboard')}
        </Button>
      </div>
    </div>
  )
}
