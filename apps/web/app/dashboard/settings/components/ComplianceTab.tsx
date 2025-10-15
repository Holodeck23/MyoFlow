'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Input
} from '@/components/ui'
import { Shield, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { useSettingsEndpoint } from '../lib/api-config'
import { RevenueStatusWidget } from './RevenueStatusWidget'
import { TaxValidationWidget } from './TaxValidationWidget'

interface ComplianceTabProps {
  isActive?: boolean
}

interface ComplianceFormData {
  vatRegistered: boolean
  vatNumber: string
  kleinunternehmerActive: boolean
  thresholdEuro: string
  taxAdvisorName: string
  taxAdvisorEmail: string
  taxAdvisorPhone: string
  rksvEnabled: boolean
  cashRegisterId: string
  signatureDeviceId: string
  lastAuditAt: string
  nextAuditDue: string
  rksvNotes: string
}

interface RksvStatus {
  status: 'not_required' | 'implementation_required' | 'compliant' | 'audit_overdue'
  thresholdPercentage: number
  nextAuditDue: string | null
  daysUntilAudit: number | null
  notes: string | null
}

const formatEuro = (cents: number) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export function ComplianceTab({ isActive = false }: ComplianceTabProps) {
  const [formData, setFormData] = useState<ComplianceFormData>({
    vatRegistered: false,
    vatNumber: '',
    kleinunternehmerActive: true,
    thresholdEuro: '55.000,00',
    taxAdvisorName: '',
    taxAdvisorEmail: '',
    taxAdvisorPhone: '',
    rksvEnabled: false,
    cashRegisterId: '',
    signatureDeviceId: '',
    lastAuditAt: '',
    nextAuditDue: '',
    rksvNotes: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [rksvStatus, setRksvStatus] = useState<RksvStatus | null>(null)
  const [rksvError, setRksvError] = useState<string | null>(null)

  const {
    data: complianceData,
    loading: isLoading,
    error,
    refetch
  } = useSettingsEndpoint('tax-compliance', isActive)

  useEffect(() => {
    if (!complianceData) return

    setFormData({
      vatRegistered: Boolean(complianceData.vatRegistered),
      vatNumber: complianceData.vatNumber || '',
      kleinunternehmerActive: complianceData.kleinunternehmerActive !== false,
      thresholdEuro:
        complianceData.kleinunternehmerThresholdCents !== undefined
          ? (complianceData.kleinunternehmerThresholdCents / 100).toFixed(2)
          : '55000.00',
      taxAdvisorName: complianceData.taxAdvisorName || '',
      taxAdvisorEmail: complianceData.taxAdvisorEmail || '',
      taxAdvisorPhone: complianceData.taxAdvisorPhone || '',
      rksvEnabled: Boolean(complianceData.rksvEnabled),
      cashRegisterId: complianceData.cashRegisterId || '',
      signatureDeviceId: complianceData.signatureDeviceId || '',
      lastAuditAt: complianceData.lastRksvAuditAt
        ? new Date(complianceData.lastRksvAuditAt).toISOString().substring(0, 10)
        : '',
      nextAuditDue: complianceData.nextRksvAuditDue
        ? new Date(complianceData.nextRksvAuditDue).toISOString().substring(0, 10)
        : '',
      rksvNotes: complianceData.rksvNotes || ''
    })
    setSuccess(false)
  }, [complianceData])

  useEffect(() => {
    if (!isActive) return

    const fetchRksv = async () => {
      try {
        const response = await fetch('/api/settings/rksv')
        if (!response.ok) {
          throw new Error('Failed to load RKSV status')
        }
        const payload = await response.json()
        setRksvStatus({
          status: payload.status,
          thresholdPercentage: payload.thresholdPercentage,
          nextAuditDue: payload.nextAuditDue,
          daysUntilAudit: payload.daysUntilAudit,
          notes: payload.requirements?.documentation || null
        })
        setRksvError(null)
      } catch (err) {
        setRksvError(err instanceof Error ? err.message : 'Unable to load RKSV status')
      }
    }

    fetchRksv()
  }, [isActive, success])

  const handleChange = <K extends keyof ComplianceFormData>(field: K, value: ComplianceFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  const parseEuroToCents = (value: string, fallback: number) => {
    const normalised = value.replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(normalised)
    if (Number.isNaN(parsed)) {
      return fallback
    }
    return Math.round(parsed * 100)
  }

  const handleSave = async () => {
    setFormError(null)

    if (formData.vatRegistered && !formData.vatNumber.trim()) {
      setFormError('VAT number is required when VAT registered.')
      return
    }

    const thresholdCents = parseEuroToCents(formData.thresholdEuro, 5_500_000)

    try {
      setIsSaving(true)
      const payload: Record<string, unknown> = {
        vatRegistered: formData.vatRegistered,
        vatNumber: formData.vatRegistered ? formData.vatNumber.trim().toUpperCase() : null,
        kleinunternehmerActive: formData.kleinunternehmerActive,
        kleinunternehmerThresholdCents: thresholdCents,
        taxAdvisor: {
          name: formData.taxAdvisorName.trim() || null,
          email: formData.taxAdvisorEmail.trim() || null,
          phone: formData.taxAdvisorPhone.trim() || null
        },
        rksv: {
          enabled: formData.rksvEnabled,
          cashRegisterId: formData.cashRegisterId.trim() || null,
          signatureDeviceId: formData.signatureDeviceId.trim() || null,
          lastAuditAt: formData.lastAuditAt ? new Date(formData.lastAuditAt).toISOString() : null,
          nextAuditDue: formData.nextAuditDue ? new Date(formData.nextAuditDue).toISOString() : null,
          notes: formData.rksvNotes.trim() || null
        }
      }

      const response = await fetch('/api/settings/tax-compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update compliance settings')
      }

      await refetch()
      setSuccess(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save compliance settings.')
      setSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  const complianceStatus = useMemo(() => {
    if (!complianceData?.kleinunternehmerActive && complianceData?.vatRegistered) {
      return 'VAT Registered'
    }
    return complianceData?.kleinunternehmerActive ? 'Kleinunternehmer' : 'Unknown'
  }, [complianceData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading compliance settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <RevenueStatusWidget />
        <TaxValidationWidget />

        <Card>
          <CardHeader>
            <CardTitle>Tax Compliance Configuration</CardTitle>
            <CardDescription>
              Manage VAT registration, Kleinunternehmer status, tax advisor details, and RKSV setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{formError}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">Compliance settings saved.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">VAT &amp; Kleinunternehmer Status</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">VAT Registered</p>
                  <p className="text-sm text-gray-600">
                    Charge Austrian VAT on invoices and submit VAT returns.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.vatRegistered}
                  onChange={(e) => {
                    const checked = e.target.checked
                    handleChange('vatRegistered', checked)
                    if (checked) {
                      handleChange('kleinunternehmerActive', false)
                    }
                    if (!checked) {
                      handleChange('vatNumber', '')
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {formData.vatRegistered && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vat-number">VAT / UID Number</Label>
                    <Input
                      id="vat-number"
                      value={formData.vatNumber}
                      onChange={(e) => handleChange('vatNumber', e.target.value)}
                      placeholder="ATU12345678"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <p className="text-xs text-gray-600">
                      UID numbers must start with ATU followed by 8 digits.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium text-gray-800">Kleinunternehmer</p>
                  <p className="text-sm text-gray-600">
                    Revenue below €55,000 with no VAT charged on invoices.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.kleinunternehmerActive}
                  onChange={(e) => {
                    const checked = e.target.checked
                    handleChange('kleinunternehmerActive', checked)
                    if (checked) {
                      handleChange('vatRegistered', false)
                      handleChange('vatNumber', '')
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="threshold">Annual Threshold (€)</Label>
                  <Input
                    id="threshold"
                    value={formData.thresholdEuro}
                    onChange={(e) => handleChange('thresholdEuro', e.target.value)}
                    placeholder="55000"
                  />
                </div>
                <div className="flex items-end">
                  <p className="text-xs text-gray-500">
                    Includes the 10% tolerance (€60,500) before full VAT obligations apply.
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">Tax Advisor</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="advisor-name">Name</Label>
                  <Input
                    id="advisor-name"
                    value={formData.taxAdvisorName}
                    onChange={(e) => handleChange('taxAdvisorName', e.target.value)}
                    placeholder="Mag. Anna Huber"
                  />
                </div>
                <div>
                  <Label htmlFor="advisor-email">Email</Label>
                  <Input
                    id="advisor-email"
                    value={formData.taxAdvisorEmail}
                    onChange={(e) => handleChange('taxAdvisorEmail', e.target.value)}
                    placeholder="steuerberatung@example.at"
                  />
                </div>
                <div>
                  <Label htmlFor="advisor-phone">Phone</Label>
                  <Input
                    id="advisor-phone"
                    value={formData.taxAdvisorPhone}
                    onChange={(e) => handleChange('taxAdvisorPhone', e.target.value)}
                    placeholder="+43 732 123456"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">RKSV (Registrierkassenpflicht)</h3>

              {rksvError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-700">{rksvError}</p>
                  </div>
                </div>
              )}

              {rksvStatus && (
                <div className="p-3 rounded-md border bg-gray-50 text-sm space-y-1">
                  <p>
                    Status:{' '}
                    <span className="font-medium text-gray-800">
                      {rksvStatus.status === 'not_required' && 'Not required'}
                      {rksvStatus.status === 'implementation_required' && 'Implementation required'}
                      {rksvStatus.status === 'compliant' && 'Compliant'}
                      {rksvStatus.status === 'audit_overdue' && 'Audit overdue'}
                    </span>
                  </p>
                  <p>Threshold usage: {rksvStatus.thresholdPercentage.toFixed(1)}%</p>
                  {rksvStatus.nextAuditDue && (
                    <p>
                      Next audit due:{' '}
                      {new Date(rksvStatus.nextAuditDue).toLocaleDateString('de-AT')}
                      {rksvStatus.daysUntilAudit !== null && rksvStatus.daysUntilAudit >= 0
                        ? ` (${rksvStatus.daysUntilAudit} days remaining)`
                        : ''}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">RKSV Enabled</p>
                  <p className="text-sm text-gray-600">
                    Required after €15,000 annual cash revenue or if tax advisor recommends.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.rksvEnabled}
                  onChange={(e) => handleChange('rksvEnabled', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {formData.rksvEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cash-register-id">Cash Register ID</Label>
                    <Input
                      id="cash-register-id"
                      value={formData.cashRegisterId}
                      onChange={(e) => handleChange('cashRegisterId', e.target.value)}
                      placeholder="KASSE-1234"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signature-device-id">Signature Device ID</Label>
                    <Input
                      id="signature-device-id"
                      value={formData.signatureDeviceId}
                      onChange={(e) => handleChange('signatureDeviceId', e.target.value)}
                      placeholder="SIGN-1234"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-audit">Last RKSV Audit</Label>
                    <Input
                      id="last-audit"
                      type="date"
                      value={formData.lastAuditAt}
                      onChange={(e) => handleChange('lastAuditAt', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="next-audit">Next Audit Due</Label>
                    <Input
                      id="next-audit"
                      type="date"
                      value={formData.nextAuditDue}
                      onChange={(e) => handleChange('nextAuditDue', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="rksv-notes">Notes</Label>
                    <textarea
                      id="rksv-notes"
                      value={formData.rksvNotes}
                      onChange={(e) => handleChange('rksvNotes', e.target.value)}
                      placeholder="Document status of signature device, planned implementation steps, etc."
                      className="w-full min-h-[80px] rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => refetch()}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Compliance Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>VAT Status</span>
                <span className="font-medium text-gray-900">{complianceStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kleinunternehmer Threshold</span>
                <span className="font-medium text-gray-900">
                  {complianceData?.kleinunternehmerThresholdCents !== undefined
                    ? formatEuro(complianceData.kleinunternehmerThresholdCents)
                    : '€55,000.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated</span>
                <span className="font-medium text-gray-900">
                  {complianceData?.updatedAt
                    ? new Date(complianceData.updatedAt).toLocaleDateString('de-AT')
                    : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax Advisor</span>
                <span className="font-medium text-gray-900">
                  {complianceData?.taxAdvisorName || 'Not provided'}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-800">RKSV Summary</h4>
              {rksvStatus ? (
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-medium text-gray-900">
                      {rksvStatus.status === 'not_required' && 'Not required'}
                      {rksvStatus.status === 'implementation_required' && 'Implementation required'}
                      {rksvStatus.status === 'compliant' && 'Compliant'}
                      {rksvStatus.status === 'audit_overdue' && 'Audit overdue'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Threshold Usage</span>
                    <span className="font-medium text-gray-900">
                      {rksvStatus.thresholdPercentage.toFixed(1)}%
                    </span>
                  </div>
                  {rksvStatus.nextAuditDue && (
                    <div className="flex items-center justify-between">
                      <span>Next Audit Due</span>
                      <span className="font-medium text-gray-900">
                        {new Date(rksvStatus.nextAuditDue).toLocaleDateString('de-AT')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  RKSV status will appear once travel revenue data has been calculated.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
