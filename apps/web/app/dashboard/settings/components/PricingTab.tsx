'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@myoflow/lib'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button
} from '@/components/ui'
import { DollarSign, AlertCircle, Euro } from 'lucide-react'

interface PricingTabProps {
  profileData: any
}

export function PricingTab({ profileData }: PricingTabProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pricingSettings, setPricingSettings] = useState<any>(null)

  useEffect(() => {
    fetchPricingSettings()
  }, [])

  const fetchPricingSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/settings/pricing')
      if (response.ok) {
        const data = await response.json()
        setPricingSettings(data.pricingSettings)
      } else {
        setError('Failed to load pricing settings')
      }
    } catch (err) {
      setError('Network error loading pricing settings')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pricing settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Euro className="w-5 h-5" />
              <span>Pricing Configuration</span>
            </CardTitle>
            <CardDescription>
              Manage your service rates and pricing structure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Pricing configuration is under development. Service rate templates are currently managed in the main Invoices section.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Service Rates</h3>
                <p className="text-gray-600 mb-4">
                  Your current service rates are managed through the invoice system.
                  Visit the Invoices section to create and manage service rate templates.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Package Deals</h3>
                <p className="text-gray-600 mb-4">
                  Package pricing and bulk service discounts will be available in a future update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Euro className="w-4 h-4 mr-2" />
                Add Service Rate
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <DollarSign className="w-4 h-4 mr-2" />
                Create Package Deal
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                These features are coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}