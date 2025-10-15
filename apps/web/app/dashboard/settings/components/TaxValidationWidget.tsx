'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@myoflow/lib'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui'
import {
  Shield,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react'

interface TaxValidationStatus {
  isValidated: boolean
  validatedAt: string | null
  validatedBy: string | null
}

export function TaxValidationWidget() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<TaxValidationStatus>({
    isValidated: false,
    validatedAt: null,
    validatedBy: null,
  })

  useEffect(() => {
    fetchValidationStatus()
  }, [])

  const fetchValidationStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/profile')
      const json = await response.json()

      if (!response.ok || (json && json.success === false)) {
        throw new Error(
          (json && typeof json.error === 'string' && json.error) ||
            'Failed to fetch validation status',
        )
      }

      const data = json && typeof json === 'object' && 'data' in json ? json.data : json
      setStatus({
        isValidated: data?.taxValidationCompleted || false,
        validatedAt: data?.taxValidatedAt || null,
        validatedBy: data?.taxValidatedBy || null,
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsValidated = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/settings/tax-compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxValidationCompleted: true,
          taxValidatedAt: new Date().toISOString(),
        }),
      })

      const json = await response.json()
      if (!response.ok || (json && json.success === false)) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) ||
          'Failed to update validation status'
        throw new Error(errorMessage)
      }

      await fetchValidationStatus() // Refresh status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleClearValidation = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/settings/tax-compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxValidationCompleted: false,
          taxValidatedAt: null,
        }),
      })

      const json = await response.json()
      if (!response.ok || (json && json.success === false)) {
        const errorMessage =
          (json && typeof json.error === 'string' && json.error) ||
          'Failed to clear validation status'
        throw new Error(errorMessage)
      }

      await fetchValidationStatus() // Refresh status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Loading validation status...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Professional Tax Validation</span>
        </CardTitle>
        <CardDescription>
          Track professional validation of your tax calculations by an Austrian Steuerberater
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

        {/* Validation Status */}
        <div
          className={`p-4 border rounded-lg ${
            status.isValidated
              ? 'bg-green-50 border-green-200'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            {status.isValidated ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3
                className={`text-sm font-medium ${
                  status.isValidated ? 'text-green-800' : 'text-orange-800'
                }`}
              >
                {status.isValidated ? 'Validation Completed' : 'Validation Pending'}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  status.isValidated ? 'text-green-700' : 'text-orange-700'
                }`}
              >
                {status.isValidated
                  ? `Your tax calculations were professionally validated on ${
                      status.validatedAt
                        ? new Date(status.validatedAt).toLocaleDateString('de-AT', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'unknown date'
                    }.`
                  : 'We recommend having your tax calculations professionally validated by an Austrian Steuerberater to ensure compliance with current Austrian tax law.'}
              </p>
              {status.isValidated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearValidation}
                  disabled={saving}
                  className="mt-3 border-green-300 text-green-700 hover:bg-green-100"
                >
                  Clear Validation
                </Button>
              )}
              {!status.isValidated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsValidated}
                  disabled={saving}
                  className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {saving ? 'Saving...' : 'Mark as Validated'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* VAT-Exempt Therapy Services Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Therapy Services: VAT-Exempt Status
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                Most Austrian therapy services are <strong>VAT-exempt</strong> (steuerbefreit)
                under §6 Abs. 1 Z 19 UStG, regardless of your annual revenue. This includes:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Physiotherapy (Physiotherapie)</li>
                <li>Massage therapy (Heilmassage)</li>
                <li>Occupational therapy (Ergotherapie)</li>
                <li>Speech therapy (Logopädie)</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  <strong>Important:</strong> The Kleinunternehmer threshold (€55,000) still
                  applies for administrative requirements, but VAT-exempt services do not charge
                  VAT regardless of revenue. Consult your Steuerberater for professional guidance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Consultation Notice */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Need Professional Help?</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>When to consult a Steuerberater:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Annual revenue approaching €55,000</li>
              <li>Questions about VAT-exempt vs. VAT-liable services</li>
              <li>First-time tax filing for your practice</li>
              <li>Changes in business structure or services</li>
              <li>Uncertainty about invoice requirements</li>
            </ul>
            <p className="mt-3 text-xs italic text-gray-500">
              MyoFlow provides tools to assist with Austrian tax compliance, but we are not tax
              advisors. Professional validation by an Austrian Steuerberater is recommended for
              legal compliance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
