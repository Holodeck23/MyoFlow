'use client'

import { useEffect, useState } from 'react'
import { useTranslation, assertValidLogoUrl } from '@myoflow/lib'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Input,
  InfoTooltip,
} from '@/components/ui'
import { AlertCircle, Image as ImageIcon, FileText, CheckCircle } from 'lucide-react'

interface BrandingSettings {
  invoiceLogoUrl: string | null
  invoiceDisplayPreference: 'NAME' | 'LOGO' | 'BOTH'
  invoiceThankYouMessage: string | null
  brandColor: string
}

export function InvoiceBrandingWidget() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<BrandingSettings>({
    invoiceLogoUrl: null,
    invoiceDisplayPreference: 'NAME',
    invoiceThankYouMessage: null,
    brandColor: '#0066cc',
  })

  useEffect(() => {
    fetchBrandingSettings()
  }, [])

  const fetchBrandingSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/invoice-branding')

      if (!response.ok) {
        throw new Error('Failed to fetch branding settings')
      }

      const data = await response.json()
      setFormData({
        invoiceLogoUrl: data.invoiceLogoUrl || null,
        invoiceDisplayPreference: data.invoiceDisplayPreference || 'NAME',
        invoiceThankYouMessage: data.invoiceThankYouMessage || null,
        brandColor: data.brandColor || '#0066cc',
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceLogoUrl: formData.invoiceLogoUrl || null,
          invoiceDisplayPreference: formData.invoiceDisplayPreference,
          invoiceThankYouMessage: formData.invoiceThankYouMessage || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save branding settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000) // Clear success message after 3s
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = <K extends keyof BrandingSettings>(
    field: K,
    value: BrandingSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSuccess(false) // Clear success when user edits
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Loading branding settings...</p>
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
          <ImageIcon className="w-5 h-5" />
          <span>Invoice Branding</span>
        </CardTitle>
        <CardDescription>
          Customize how your business appears on invoices sent to clients
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

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">Branding settings saved successfully!</p>
              </div>
            </div>
          </div>
        )}

        {/* Logo URL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="logo-url">Invoice Logo URL (Optional)</Label>
            <InfoTooltip fieldKey="logoUrl" />
          </div>
          <Input
            id="logo-url"
            type="url"
            value={formData.invoiceLogoUrl || ''}
            onChange={(event) => {
              setError(null)
              handleChange('invoiceLogoUrl', event.target.value || null)
            }}
            onBlur={() => {
              const value = formData.invoiceLogoUrl?.trim()
              if (!value) {
                setError(null)
                return
              }
              try {
                assertValidLogoUrl(value)
                setError(null)
              } catch (validationError) {
                setError(
                  validationError instanceof Error
                    ? validationError.message
                    : 'Invalid logo URL (use https:// or data URL)'
                )
              }
            }}
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-gray-500">
            Enter a URL to your business logo. Recommended size: 200x80px or similar aspect ratio.
          </p>
        </div>

        {/* Logo Preview */}
        {formData.invoiceLogoUrl && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm font-medium text-gray-700 mb-2">Logo Preview</p>
            <div className="flex items-center justify-center bg-white p-4 rounded border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.invoiceLogoUrl}
                alt="Invoice logo preview"
                className="max-h-20 max-w-full object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                  setError('Invalid logo URL or image failed to load')
                }}
              />
            </div>
          </div>
        )}

        {/* Display Preference */}
        <div className="space-y-2">
          <Label htmlFor="display-preference">Invoice Display Preference</Label>
          <select
            id="display-preference"
            value={formData.invoiceDisplayPreference}
            onChange={(e) =>
              handleChange(
                'invoiceDisplayPreference',
                e.target.value as 'NAME' | 'LOGO' | 'BOTH'
              )
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="NAME">Business Name Only</option>
            <option value="LOGO">Logo Only</option>
            <option value="BOTH">Both Logo and Name</option>
          </select>
          <p className="text-xs text-gray-500">
            {formData.invoiceDisplayPreference === 'NAME' &&
              'Invoices will show your business name in the header'}
            {formData.invoiceDisplayPreference === 'LOGO' &&
              'Invoices will show your logo in the header (requires logo URL)'}
            {formData.invoiceDisplayPreference === 'BOTH' &&
              'Invoices will show both your logo and business name'}
          </p>
        </div>

        {/* Display Preference Warning */}
        {formData.invoiceDisplayPreference !== 'NAME' && !formData.invoiceLogoUrl && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              <div className="ml-3">
                <p className="text-sm text-orange-800">
                  You&apos;ve selected &quot;{formData.invoiceDisplayPreference}&quot; but no logo URL is set.
                  Invoices will fall back to showing your business name.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Thank You Message */}
        <div className="space-y-2">
          <Label htmlFor="thank-you-message">Custom Thank You Message (Optional)</Label>
          <textarea
            id="thank-you-message"
            value={formData.invoiceThankYouMessage || ''}
            onChange={(e) => handleChange('invoiceThankYouMessage', e.target.value || null)}
            placeholder="Vielen Dank für Ihr Vertrauen!"
            maxLength={500}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md resize-none"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              This message will appear at the bottom of your invoices
            </p>
            <p className="text-xs text-gray-500">
              {(formData.invoiceThankYouMessage || '').length}/500
            </p>
          </div>
        </div>

        {/* Preview Section */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Invoice Header Preview</h4>
          <div className="p-6 bg-gray-50 rounded-lg border">
            <div className="bg-white p-6 rounded shadow-sm">
              {/* Logo/Name Display */}
              <div className="mb-4">
                {formData.invoiceDisplayPreference === 'NAME' && (
                  <div className="text-2xl font-bold text-gray-900">Your Business Name</div>
                )}
                {formData.invoiceDisplayPreference === 'LOGO' && formData.invoiceLogoUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.invoiceLogoUrl}
                      alt="Logo"
                      className="h-16 object-contain"
                    />
                  </>
                )}
                {formData.invoiceDisplayPreference === 'LOGO' && !formData.invoiceLogoUrl && (
                  <div className="text-2xl font-bold text-gray-400">Your Business Name</div>
                )}
                {formData.invoiceDisplayPreference === 'BOTH' && (
                  <div className="space-y-2">
                    {formData.invoiceLogoUrl && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.invoiceLogoUrl}
                          alt="Logo"
                          className="h-12 object-contain"
                        />
                      </>
                    )}
                    <div className="text-xl font-bold text-gray-900">Your Business Name</div>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <p>Your Business Address</p>
                <p>Email: your@email.com</p>
              </div>

              {formData.invoiceThankYouMessage && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-700 italic">
                    {formData.invoiceThankYouMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={fetchBrandingSettings} disabled={saving}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Branding Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
