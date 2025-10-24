'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { addMinutes, format } from 'date-fns'
import { X } from 'lucide-react'
import { Input, Button, Label } from '@/components/ui'
import { useTranslation } from '@myoflow/lib'

export interface ClientOption {
  id: string
  name: string
  email?: string | null
}

export interface ServiceOption {
  id: string
  name: string
  durationMin: number
  priceCents: number
  category: string
}

export interface LocationOption {
  id: string
  name: string
  type: string
  street?: string | null
  postalCode?: string | null
  city?: string | null
}

export interface AppointmentForEdit {
  id: string
  clientId: string
  serviceId: string
  locationId: string
  start: string
  end: string
  notes?: string | null
}

type AppointmentFormMode = 'create' | 'edit'

interface AppointmentModalProps {
  open: boolean
  mode: AppointmentFormMode
  onClose: () => void
  initialDate: Date | null
  appointment?: AppointmentForEdit
  clients: ClientOption[]
  services: ServiceOption[]
  locations: LocationOption[]
  loading: boolean
  missingData: {
    clients: boolean
    services: boolean
    locations: boolean
  }
  onRefreshReference: () => Promise<void>
  onCreated?: () => Promise<void>
  onUpdated?: (appointment: AppointmentForEdit) => Promise<void>
}

interface FormState {
  clientId: string
  serviceId: string
  locationId: string
  date: string
  startTime: string
  endTime: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

export function AppointmentModal({
  open,
  mode,
  onClose,
  initialDate,
  appointment,
  clients,
  services,
  locations,
  loading,
  missingData,
  onRefreshReference,
  onCreated,
  onUpdated
}: AppointmentModalProps) {
  const { t } = useTranslation()

  const defaultValues = useMemo<FormState>(() => {
    if (mode === 'edit' && appointment) {
      const startDate = new Date(appointment.start)
      const endDate = new Date(appointment.end)
      return {
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        locationId: appointment.locationId,
        date: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        notes: appointment.notes || ''
      }
    }

    const baseDate = initialDate ?? new Date()
    const date = format(baseDate, 'yyyy-MM-dd')
    const startTime = '09:00'
    const endTime = format(addMinutes(new Date(`${date}T${startTime}:00`), 60), 'HH:mm')

    return {
      clientId: '',
      serviceId: '',
      locationId: '',
      date,
      startTime,
      endTime,
      notes: ''
    }
  }, [mode, appointment, initialDate])

  const [formState, setFormState] = useState<FormState>(defaultValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Only block while loading, not after load completes (even if empty)
  // This allows users to proceed if fetch fails or to use the warning links to create data
  const blockingMissingData = mode === 'create' && loading

  useEffect(() => {
    if (open) {
      setFormState(defaultValues)
      setErrors({})
      setFormError(null)
      setSubmitting(false)
    }
  }, [open, defaultValues])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }))
    setErrors((prev) => {
      const copy = { ...prev }
      delete copy[field]
      return copy
    })
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!formState.clientId) {
      nextErrors.clientId = t('calendarAppointment.errors.clientRequired')
    }
    if (!formState.serviceId) {
      nextErrors.serviceId = t('calendarAppointment.errors.serviceRequired')
    }
    if (!formState.locationId) {
      nextErrors.locationId = t('calendarAppointment.errors.locationRequired')
    }
    if (!formState.date) {
      nextErrors.date = t('calendarAppointment.errors.dateRequired')
    }
    if (!formState.startTime) {
      nextErrors.startTime = t('calendarAppointment.errors.startTimeRequired')
    }
    if (!formState.endTime) {
      nextErrors.endTime = t('calendarAppointment.errors.endTimeRequired')
    }

    if (!nextErrors.startTime && !nextErrors.endTime) {
      const startMinutes =
        parseInt(formState.startTime.slice(0, 2), 10) * 60 + parseInt(formState.startTime.slice(3), 10)
      const endMinutes = parseInt(formState.endTime.slice(0, 2), 10) * 60 + parseInt(formState.endTime.slice(3), 10)
      if (endMinutes <= startMinutes) {
        nextErrors.endTime = t('calendarAppointment.errors.endAfterStart')
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildPayload = () => {
    const start = new Date(`${formState.date}T${formState.startTime}:00`)
    const end = new Date(`${formState.date}T${formState.endTime}:00`)

    return {
      clientId: formState.clientId,
      serviceId: formState.serviceId,
      locationId: formState.locationId,
      start: start.toISOString(),
      end: end.toISOString(),
      notes: formState.notes.trim()
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting || blockingMissingData) {
      return
    }

    if (!validate()) return

    try {
      setSubmitting(true)
      setFormError(null)

      const payload = buildPayload()

      if (mode === 'create') {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...payload,
            notes: payload.notes || undefined
          })
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          if (response.status === 409) {
            setFormError(t('calendarAppointment.errorConflict'))
          } else {
            setFormError(body.error || t('calendarAppointment.errorGeneric'))
          }
          setSubmitting(false)
          return
        }

        if (onCreated) {
          await onCreated()
        }
      } else if (mode === 'edit' && appointment) {
        const response = await fetch(`/api/appointments/${appointment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId: payload.clientId,
            serviceId: payload.serviceId,
            locationId: payload.locationId,
            start: payload.start,
            end: payload.end,
            notes: payload.notes
          })
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          if (response.status === 409) {
            setFormError(t('calendarAppointment.errorConflict'))
          } else {
            setFormError(body.error || t('calendarAppointment.errorGeneric'))
          }
          setSubmitting(false)
          return
        }

        const { appointment: updatedAppointment } = await response.json()
        if (onUpdated) {
          await onUpdated({
            id: updatedAppointment.id,
            clientId: updatedAppointment.clientId,
            serviceId: updatedAppointment.serviceId,
            locationId: updatedAppointment.locationId,
            start: updatedAppointment.start,
            end: updatedAppointment.end,
            notes: updatedAppointment.notes
          })
        }
      }

      onClose()
    } catch (err) {
      console.error('Failed to submit appointment:', err)
      setFormError(t('calendarAppointment.errorGeneric'))
      setSubmitting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3 py-6 sm:px-6">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === 'edit' ? t('calendarAppointment.editTitle') : t('calendarAppointment.title')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('calendarAppointment.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5">
          {blockingMissingData && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p>{t('calendarAppointment.missingData.title')}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {missingData.clients && (
                  <li>
                    {t('calendarAppointment.missingData.clients')}{' '}
                    <Link href="/dashboard/clients/new" className="text-amber-700 underline">
                      {t('calendarAppointment.missingData.clientsCta')}
                    </Link>
                  </li>
                )}
                {missingData.services && (
                  <li>
                    {t('calendarAppointment.missingData.services')}{' '}
                    <Link href="/dashboard/settings?tab=pricing" className="text-amber-700 underline">
                      {t('calendarAppointment.missingData.servicesCta')}
                    </Link>
                  </li>
                )}
                {missingData.locations && (
                  <li>
                    {t('calendarAppointment.missingData.locations')}{' '}
                    <Link href="/dashboard/settings?tab=profile" className="text-amber-700 underline">
                      {t('calendarAppointment.missingData.locationsCta')}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {loading && (
            <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {t('calendarAppointment.loadingOptions')}
            </div>
          )}

          {formError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="clientId">{t('calendarAppointment.clientLabel')}</Label>
              <select
                id="clientId"
                value={formState.clientId}
                onChange={(event) => updateField('clientId', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={mode === 'edit' ? false : blockingMissingData}
              >
                <option value="">{t('calendarAppointment.clientPlaceholder')}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.email ? `(${client.email})` : ''}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}
            </div>

            <div>
              <Label htmlFor="serviceId">{t('calendarAppointment.serviceLabel')}</Label>
              <select
                id="serviceId"
                value={formState.serviceId}
                onChange={(event) => updateField('serviceId', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={mode === 'edit' ? false : blockingMissingData}
              >
                <option value="">{t('calendarAppointment.servicePlaceholder')}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {Math.round(service.durationMin)}min
                  </option>
                ))}
              </select>
              {errors.serviceId && <p className="mt-1 text-sm text-red-600">{errors.serviceId}</p>}
            </div>

            <div>
              <Label htmlFor="locationId">{t('calendarAppointment.locationLabel')}</Label>
              <select
                id="locationId"
                value={formState.locationId}
                onChange={(event) => updateField('locationId', event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={mode === 'edit' ? false : blockingMissingData}
              >
                <option value="">{t('calendarAppointment.locationPlaceholder')}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.city ? ` · ${location.city}` : ''}
                  </option>
                ))}
              </select>
              {errors.locationId && <p className="mt-1 text-sm text-red-600">{errors.locationId}</p>}
            </div>

            <div>
              <Label htmlFor="date">{t('calendarAppointment.dateLabel')}</Label>
              <Input
                id="date"
                type="date"
                value={formState.date}
                onChange={(event) => updateField('date', event.target.value)}
                className="mt-1"
                disabled={blockingMissingData}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            <div>
              <Label htmlFor="startTime">{t('calendarAppointment.startTimeLabel')}</Label>
              <Input
                id="startTime"
                type="time"
                value={formState.startTime}
                onChange={(event) => updateField('startTime', event.target.value)}
                className="mt-1"
                disabled={blockingMissingData}
              />
              {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
            </div>

            <div>
              <Label htmlFor="endTime">{t('calendarAppointment.endTimeLabel')}</Label>
              <Input
                id="endTime"
                type="time"
                value={formState.endTime}
                onChange={(event) => updateField('endTime', event.target.value)}
                className="mt-1"
                disabled={blockingMissingData}
              />
              {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="notes">{t('calendarAppointment.notesLabel')}</Label>
            <textarea
              id="notes"
              value={formState.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              className="mt-1 h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder={t('calendarAppointment.notesPlaceholder')}
              disabled={blockingMissingData}
            />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-500">
              <button type="button" className="underline" onClick={onRefreshReference}>
                {t('calendarAppointment.refreshReference')}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                {t('calendarAppointment.cancel')}
              </Button>
              <Button type="submit" disabled={submitting || blockingMissingData}>
                {submitting
                  ? t('calendarAppointment.submitting')
                  : mode === 'edit'
                    ? t('calendarAppointment.submitUpdate')
                    : t('calendarAppointment.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
