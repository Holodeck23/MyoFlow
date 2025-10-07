'use client'

import { useState } from 'react'
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
import { useSettingsEndpoint } from '../lib/api-config'
import { RevenueStatusWidget } from './RevenueStatusWidget'

interface ComplianceTabProps {
  profileData: any
  overviewData: any
  isActive?: boolean
}

export function ComplianceTab({ profileData, overviewData, isActive = false }: ComplianceTabProps) {
  const { t } = useTranslation()

  // Only fetch when tab is active
  const { data: complianceData, loading: isLoading, error } = useSettingsEndpoint('tax-compliance', isActive)

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
      <div className="lg:col-span-2 space-y-6">
        {/* Revenue Status Widget - New */}
        <RevenueStatusWidget />

        {/* Professional Tax Validation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Professional Tax Validation</span>
            </CardTitle>
            <CardDescription>
              Austrian Steuerberater validation status for tax calculations
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

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-orange-800">
                    Validation Recommended
                  </h4>
                  <p className="text-sm text-orange-700 mt-1">
                    We recommend having your tax calculations professionally validated by an Austrian Steuerberater
                    to ensure compliance with current Austrian tax law.
                  </p>
                </div>
              </div>
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