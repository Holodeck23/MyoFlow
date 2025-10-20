// i18n: All user-facing text uses t('section.key', 'fallback')
'use client'

import { cn } from '@/components/ui'
import { useTranslation } from '@myoflow/lib'

interface WizardProgressProps {
  currentStep: number
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const { t } = useTranslation()

  const STEPS = [
    {
      id: 1,
      title: t('onboarding.progress.step1Title', 'Business'),
      description: t('onboarding.progress.step1Description', 'Set address')
    },
    {
      id: 2,
      title: t('onboarding.progress.step2Title', 'Profession'),
      description: t('onboarding.progress.step2Description', 'Confirm details')
    },
    {
      id: 3,
      title: t('onboarding.progress.step3Title', 'Done'),
      description: t('onboarding.progress.step3Description', 'Get started')
    },
  ]

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
        <span>
          {t('onboarding.progress.stepOf', 'Step {current} of {total}')
            .replace('{current}', String(currentStep))
            .replace('{total}', String(STEPS.length))}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-slate-200">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-4 text-xs text-slate-600 sm:text-sm">
        {STEPS.map((step) => {
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          return (
            <li
              key={step.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm',
                isActive
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600',
                )}
              >
                {step.id}
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold">{step.title}</span>
                <span className="text-[0.7rem] text-slate-500">{step.description}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
