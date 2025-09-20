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
import { Shield, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

interface ComplianceTabProps {
  profileData: any
  overviewData: any
}

export function ComplianceTab({ profileData, overviewData }: ComplianceTabProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [complianceData, setComplianceData] = useState<any>(null)

  useEffect(() => {
    fetchComplianceSettings()
  }, [])

  const fetchComplianceSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/settings/tax-compliance')
      if (response.ok) {
        const data = await response.json()
        setComplianceData(data)
      } else {
        setError('Failed to load compliance settings')
      }
    } catch (err) {
      setError('Network error loading compliance settings')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading compliance settings...</p>
        </div>
      </div>
    )
  }

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'threshold_warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getComplianceStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Compliant'
      case 'threshold_warning':
        return 'Warning'
      default:
        return 'Needs Review'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Austrian Tax Compliance</span>
            </CardTitle>
            <CardDescription>
              Monitor your Kleinunternehmer status and Austrian tax compliance.
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
              {/* Kleinunternehmer Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  {getComplianceStatusIcon(complianceData?.kleinunternehmerStatus)}
                  <div>
                    <h3 className="text-lg font-medium">Kleinunternehmer Status</h3>
                    <p className="text-sm text-gray-600">
                      {getComplianceStatusText(complianceData?.kleinunternehmerStatus)}
                    </p>
                  </div>
                </div>

                {complianceData?.revenue && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Year Revenue</p>
                      <p className="text-lg font-semibold">
                        €{complianceData.revenue.currentYear.toLocaleString('de-AT')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Previous Year Revenue</p>
                      <p className="text-lg font-semibold">
                        €{complianceData.revenue.previousYear.toLocaleString('de-AT')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Threshold Usage</p>
                      <p className="text-lg font-semibold">
                        {complianceData.thresholdPercentage?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue Thresholds */}
              <div>
                <h3 className="text-lg font-medium mb-4">Revenue Thresholds (2025)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm">Annual Threshold</span>
                    <span className="font-medium">€35,000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm">Previous Year Threshold</span>
                    <span className="font-medium">€35,000</span>
                  </div>
                </div>
              </div>

              {/* Compliance Actions */}
              {complianceData?.kleinunternehmerStatus === 'threshold_warning' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-orange-800">
                        Threshold Warning
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        You are approaching the Kleinunternehmer revenue limit. Consider consulting with a tax advisor.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">VAT Status</span>
                <span className="font-medium">Kleinunternehmer</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tax Year</span>
                <span className="font-medium">2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {complianceData?.lastUpdated ?
                    new Date(complianceData.lastUpdated).toLocaleDateString('de-AT') :
                    'Never'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Shield className="w-4 h-4 mr-2" />
                Download Tax Report
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <AlertCircle className="w-4 h-4 mr-2" />
                Compliance Help
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Additional compliance tools coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}