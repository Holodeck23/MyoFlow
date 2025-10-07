'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@myoflow/lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Clock,
} from 'lucide-react'

interface RevenueStatus {
  status: 'SAFE' | 'WARNING' | 'EXCEEDED' | 'CRITICAL'
  currentRevenueCents: number
  percentageUsed: number
  message: string
  remainingCents: number
  isCached: boolean
  cachedAt?: string
}

interface RevenueStatusWidgetProps {
  className?: string
}

export function RevenueStatusWidget({ className }: RevenueStatusWidgetProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RevenueStatus | null>(null)

  useEffect(() => {
    const fetchRevenueStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/compliance/revenue-status')

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - Please sign in')
          }
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch revenue status')
        }

        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueStatus()
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Loading revenue status...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const formatEuro = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case 'SAFE':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'WARNING':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />
      case 'EXCEEDED':
        return <AlertCircle className="w-6 h-6 text-red-600" />
      case 'CRITICAL':
        return <AlertCircle className="w-6 h-6 text-red-700 animate-pulse" />
    }
  }

  const getStatusColor = () => {
    switch (data.status) {
      case 'SAFE':
        return 'text-green-700'
      case 'WARNING':
        return 'text-orange-700'
      case 'EXCEEDED':
        return 'text-red-700'
      case 'CRITICAL':
        return 'text-red-800'
    }
  }

  const getProgressBarColor = () => {
    switch (data.status) {
      case 'SAFE':
        return 'bg-green-600'
      case 'WARNING':
        return 'bg-orange-600'
      case 'EXCEEDED':
        return 'bg-red-600'
      case 'CRITICAL':
        return 'bg-red-700'
    }
  }

  const getBackgroundColor = () => {
    switch (data.status) {
      case 'SAFE':
        return 'bg-green-50 border-green-200'
      case 'WARNING':
        return 'bg-orange-50 border-orange-200'
      case 'EXCEEDED':
        return 'bg-red-50 border-red-200'
      case 'CRITICAL':
        return 'bg-red-100 border-red-300'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Revenue Tracking</span>
        </CardTitle>
        <CardDescription>
          Kleinunternehmer threshold: €55,000 annual revenue (10% tolerance: €60,500)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Alert */}
        <div className={`p-4 border rounded-lg ${getBackgroundColor()}`}>
          <div className="flex items-start space-x-3">
            {getStatusIcon()}
            <div className="flex-1">
              <h3 className={`text-lg font-medium ${getStatusColor()}`}>
                {data.status === 'SAFE' && 'Operating Safely'}
                {data.status === 'WARNING' && 'Approaching Threshold'}
                {data.status === 'EXCEEDED' && 'Threshold Exceeded'}
                {data.status === 'CRITICAL' && 'Urgent: Tolerance Exceeded'}
              </h3>
              <p className="text-sm text-gray-700 mt-1">{data.message}</p>
              {data.isCached && data.cachedAt && (
                <div className="flex items-center mt-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>
                    Cached data from{' '}
                    {new Date(data.cachedAt).toLocaleString('de-AT')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Threshold Usage
            </span>
            <span className="text-sm font-semibold">{data.percentageUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(data.percentageUsed, 100)}%` }}
              role="progressbar"
              aria-valuenow={data.percentageUsed}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Revenue Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Current Year Revenue</p>
            <p className="text-lg font-bold text-gray-900">
              {formatEuro(data.currentRevenueCents)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Remaining Capacity</p>
            <p className={`text-lg font-bold ${data.remainingCents < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {formatEuro(Math.abs(data.remainingCents))}
              {data.remainingCents < 0 && ' over'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Annual Threshold</p>
            <p className="text-lg font-bold text-gray-900">€55,000.00</p>
          </div>
        </div>

        {/* Thresholds Reference */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Austrian Tax Thresholds (2025)
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Kleinunternehmer Limit</span>
              <span className="font-medium">€55,000</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">10% Tolerance Limit</span>
              <span className="font-medium">€60,500</span>
            </div>
          </div>
        </div>

        {/* Action Required Banner */}
        {(data.status === 'EXCEEDED' || data.status === 'CRITICAL') && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Action Required
            </h4>
            <p className="text-sm text-red-700">
              {data.status === 'EXCEEDED' &&
                'You have exceeded the Kleinunternehmer threshold. Consider consulting a tax advisor about VAT registration requirements.'}
              {data.status === 'CRITICAL' &&
                'All future invoices MUST include VAT. Consult a tax advisor immediately to ensure compliance with Austrian tax law.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
