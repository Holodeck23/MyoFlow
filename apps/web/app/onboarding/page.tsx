// i18n: All user-facing text uses t('section.key', 'fallback')
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@myoflow/lib'
import { Step1BusinessInfo } from './components/Step1BusinessInfo'
import { Step2Professional } from './components/Step2Professional'
import { Step3Complete } from './components/Step3Complete'
import { WizardProgress } from './components/WizardProgress'
import type { ProfileSnapshot, WizardFormValues } from './types'

const DEFAULT_VALUES: WizardFormValues = {
  businessName: '',
  businessAddress: '',
  businessPostalCode: '',
  businessCity: '',
  businessCountry: 'Austria',
  designation: 'HEILMASSEUR',
  vatStatus: 'KLEINUNTERNEHMER',
  chamberRegistration: '',
  certificatesInput: '',
}

const STEP1_FIELDS: Array<keyof WizardFormValues> = [
  'businessName',
  'businessAddress',
  'businessPostalCode',
  'businessCity',
  'businessCountry',
]

const STEP2_FIELDS: Array<keyof WizardFormValues> = [
  'designation',
  'vatStatus',
]

function extractProfileSnapshot(raw: any | null | undefined): ProfileSnapshot {
  if (!raw || typeof raw !== 'object') {
    return {
      businessName: null,
      businessAddress: null,
      businessCity: null,
      businessPostalCode: null,
      businessCountry: null,
      designation: null,
      vatStatus: null,
      chamberRegistration: null,
      certificates: null,
      profileCompletionScore: null,
    }
  }

  const travel = raw.travelSettings ?? raw.travelSettingsDetail ?? null

  return {
    businessName: typeof raw.businessName === 'string' ? raw.businessName : null,
    businessAddress: typeof raw.businessAddress === 'string' ? raw.businessAddress : null,
    businessCity: typeof travel?.baseCity === 'string' ? travel.baseCity : null,
    businessPostalCode: typeof travel?.basePostalCode === 'string' ? travel.basePostalCode : null,
    businessCountry: typeof travel?.baseCountry === 'string' ? travel.baseCountry : null,
    designation: typeof raw.designation === 'string' ? raw.designation : null,
    vatStatus: typeof raw.vatStatus === 'string' ? raw.vatStatus : null,
    chamberRegistration: typeof raw.chamberRegistration === 'string' ? raw.chamberRegistration : null,
    certificates: Array.isArray(raw.certificates) ? raw.certificates : null,
    profileCompletionScore:
      typeof raw.profileCompletionScore === 'number' ? raw.profileCompletionScore : null,
  }
}

function determineInitialStep(snapshot: ProfileSnapshot): number {
  if ((snapshot.profileCompletionScore ?? 0) >= 70) {
    return 3
  }

  const hasBusinessInfo =
    Boolean(snapshot.businessName && snapshot.businessName.trim().length > 0) &&
    Boolean(snapshot.businessAddress && snapshot.businessAddress.trim().length > 0) &&
    Boolean(snapshot.businessCity && snapshot.businessCity.trim().length > 0) &&
    Boolean(snapshot.businessPostalCode && /^[1-9]\d{3}$/.test(snapshot.businessPostalCode))

  if (hasBusinessInfo) {
    return 2
  }

  return 1
}

export default function OnboardingPage() {
  const router = useRouter()
  const { update: refreshSession } = useSession()
  const { t } = useTranslation()
  const form = useForm<WizardFormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileScore, setProfileScore] = useState<number | null>(null)

  const goToStep = useCallback((step: number) => {
    setSubmitError(null)
    setCurrentStep(step)
  }, [])

  useEffect(() => {
    let active = true

    async function fetchProfile() {
      setInitialLoading(true)
      setLoadError(null)
      try {
        const response = await fetch('/api/settings/profile', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || `HTTP ${response.status}`)
        }

        const json = await response.json()
        const payload = json?.data ?? json
        if (!active) return

        const snapshot = extractProfileSnapshot(payload)
        setProfileScore(snapshot.profileCompletionScore)

        form.reset({
          businessName: snapshot.businessName ?? '',
          businessAddress: snapshot.businessAddress ?? '',
          businessPostalCode: snapshot.businessPostalCode ?? '',
          businessCity: snapshot.businessCity ?? '',
          businessCountry: snapshot.businessCountry ?? 'Austria',
          designation: snapshot.designation ?? DEFAULT_VALUES.designation,
          vatStatus: snapshot.vatStatus ?? DEFAULT_VALUES.vatStatus,
          chamberRegistration: snapshot.chamberRegistration ?? '',
          certificatesInput: snapshot.certificates?.join('\n') ?? '',
        })

        goToStep(determineInitialStep(snapshot))
      } catch (error) {
        if (!active) return
        setLoadError(error instanceof Error ? error.message : t('onboarding.common.loadError', 'Could not load profile'))
      } finally {
        if (active) {
          setInitialLoading(false)
        }
      }
    }

    fetchProfile()
    return () => {
      active = false
    }
  }, [form, goToStep, t])

  const handleStep1Next = useCallback(
    async () => {
      setSubmitError(null)
      const isValid = await form.trigger(STEP1_FIELDS, { shouldFocus: true })
      if (!isValid) {
        return
      }
      setIsSubmitting(true)
      try {
        const values = form.getValues()
        const response = await fetch('/api/settings/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: values.businessName.trim(),
            businessAddress: values.businessAddress.trim(),
            businessPostalCode: values.businessPostalCode.trim(),
            businessCity: values.businessCity.trim(),
            businessCountry: values.businessCountry.trim(),
          }),
        })

        const json = await response.json().catch(() => ({}))
        if (!response.ok || (json && json.success === false)) {
          const message =
            (json && typeof json.error === 'string' && json.error) ||
            t('onboarding.step1.errors.saveFailed', 'Business data could not be saved')
          throw new Error(message)
        }

        const snapshot = extractProfileSnapshot(json?.data ?? null)
        setProfileScore(snapshot.profileCompletionScore)
        if (typeof refreshSession === 'function') {
          // Pass updated score to JWT to prevent middleware redirect loop
          await refreshSession({
            therapistProfileCompletionScore: snapshot.profileCompletionScore
          })
        }
        goToStep(2)
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : t('onboarding.step1.errors.unknownError', 'Unknown error while saving'),
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, goToStep, refreshSession, t],
  )

  const handleStep2Next = useCallback(
    async () => {
      setSubmitError(null)
      const isValid = await form.trigger(STEP2_FIELDS, { shouldFocus: true })
      if (!isValid) {
        return
      }

      setIsSubmitting(true)
      try {
        const values = form.getValues()
        const certificates = values.certificatesInput
          .split('\n')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)

        const response = await fetch('/api/settings/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designation: values.designation,
            vatStatus: values.vatStatus,
            chamberRegistration: values.chamberRegistration
              ? values.chamberRegistration.trim()
              : null,
            certificates,
          }),
        })

        const json = await response.json().catch(() => ({}))
        if (!response.ok || (json && json.success === false)) {
          const message =
            (json && typeof json.error === 'string' && json.error) ||
            t('onboarding.step2.errors.saveFailed', 'Profile data could not be saved')
          throw new Error(message)
        }

        const snapshot = extractProfileSnapshot(json?.data ?? null)
        setProfileScore(snapshot.profileCompletionScore)
        if (typeof refreshSession === 'function') {
          // Pass updated score to JWT to prevent middleware redirect loop
          await refreshSession({
            therapistProfileCompletionScore: snapshot.profileCompletionScore
          })
        }
        goToStep(3)
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : t('onboarding.step2.errors.unknownError', 'Unknown error while saving'),
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, goToStep, refreshSession, t],
  )

  const handleFinish = () => {
    router.push('/dashboard')
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
        <p className="text-sm text-slate-500">{t('onboarding.common.loading', 'Loading onboarding...')}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {loadError}
      </div>
    )
  }

  return (
    <>
      <WizardProgress currentStep={currentStep} />

      {currentStep === 1 && (
        <Step1BusinessInfo
          form={form}
          onNext={handleStep1Next}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}

      {currentStep === 2 && (
        <Step2Professional
          form={form}
          onBack={() => goToStep(1)}
          onNext={handleStep2Next}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}

      {currentStep === 3 && (
        <Step3Complete
          form={form}
          onBack={() => goToStep(2)}
          onFinish={handleFinish}
          profileScore={profileScore}
        />
      )}
    </>
  )
}
