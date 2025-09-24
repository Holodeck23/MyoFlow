'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Shield, ArrowLeft, DollarSign, TrendingUp, TrendingDown, FileText, Users, Activity } from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  totalRevenue: {
    amount: number
    count: number
  }
  monthlyRevenue: {
    amount: number
    count: number
    growth: number
  }
  yearlyRevenue: {
    amount: number
    count: number
  }
  invoiceStats: {
    total: number
    paid: number
    paidPercentage: number
  }
  therapistStats: {
    total: number
    active: number
    activePercentage: number
  }
  topTherapists: Array<{
    id: string
    name: string
    email: string
    totalRevenue: number
    invoiceCount: number
  }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    invoices: number
  }>
}

export default function AdminAnalyticsClient() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      setError('Failed to load analytics')
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
                <p className="text-sm text-gray-500">Business insights and revenue metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.totalRevenue.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{analytics.totalRevenue.count} invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.monthlyRevenue.amount)}
                  </p>
                  <div className="flex items-center space-x-1">
                    {analytics.monthlyRevenue.growth >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <p className={`text-xs ${analytics.monthlyRevenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(analytics.monthlyRevenue.growth)}% MoM
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Invoice Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.invoiceStats.paidPercentage}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {analytics.invoiceStats.paid} of {analytics.invoiceStats.total} paid
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Therapists</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.therapistStats.activePercentage}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {analytics.therapistStats.active} of {analytics.therapistStats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyTrend.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{month.month}</p>
                      <p className="text-sm text-gray-600">{month.invoices} invoices</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(month.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Therapists */}
          <Card>
            <CardHeader>
              <CardTitle>Top Therapists by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topTherapists.map((therapist, index) => (
                  <div key={therapist.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{therapist.name}</p>
                        <p className="text-sm text-gray-600">{therapist.invoiceCount} invoices</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(therapist.totalRevenue)}</p>
                    </div>
                  </div>
                ))}
                {analytics.topTherapists.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No revenue data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Year-to-Date Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(analytics.yearlyRevenue.amount)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.yearlyRevenue.count}
                </p>
                <p className="text-sm text-gray-600 mt-1">Invoices Generated</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.yearlyRevenue.count > 0 ? formatCurrency(analytics.yearlyRevenue.amount / analytics.yearlyRevenue.count) : '€0.00'}
                </p>
                <p className="text-sm text-gray-600 mt-1">Average Invoice</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}