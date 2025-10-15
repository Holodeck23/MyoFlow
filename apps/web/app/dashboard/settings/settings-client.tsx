'use client'

import { useState, useEffect, Suspense, lazy, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@myoflow/lib'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { ChevronRight, Home, Download } from 'lucide-react'
import { SETTINGS_TABS } from './lib/icons'

// Lazy load all tab components for code splitting
const OverviewTab = lazy(() => import('./components/OverviewTab').then(m => ({ default: m.OverviewTab })))
const ProfileTab = lazy(() => import('./components/ProfileTab').then(m => ({ default: m.ProfileTab })))
const TravelTab = lazy(() => import('./components/TravelTab').then(m => ({ default: m.TravelTab })))
const PricingTab = lazy(() => import('./components/PricingTab').then(m => ({ default: m.PricingTab })))
const ComplianceTab = lazy(() => import('./components/ComplianceTab').then(m => ({ default: m.ComplianceTab })))
const SystemTab = lazy(() => import('./components/SystemTab').then(m => ({ default: m.SystemTab })))

// Error boundary for settings tabs
import ErrorBoundary, { SettingsErrorFallback } from './components/ErrorBoundary'

interface ProfileCompletionItem {
  id: string
  title: string
  description: string
  completed: boolean
  tab: string
  priority: 'high' | 'medium' | 'low'
}

export default function SettingsClient() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  // Get initial tab from URL params or default to overview
  const initialTab = searchParams?.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)

  // State for profile data - only load when needed
  const [profileData, setProfileData] = useState<any>(null)
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionItem[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [overviewData, setOverviewData] = useState<any>(null)
  const [isDataLoading, setIsDataLoading] = useState(false)

  const fetchSettingsOverview = useCallback(async () => {
    try {
      setIsDataLoading(true)
      const response = await fetch('/api/settings/overview')
      if (response.ok) {
        const json = await response.json()
        if (json && json.success === false) {
          console.error('Failed to fetch settings overview', json.error)
          setStaticFallbackData()
          return
        }
        const data = json && typeof json === 'object' && 'data' in json ? json.data : json
        setOverviewData(data)

        // Transform API data to match existing UI structure
        const completionItems: ProfileCompletionItem[] = data.profileCompletion.missingItems.map((item: any, index: number) => ({
          id: `missing-${index}`,
          title: item.item,
          description: `Complete ${item.item.toLowerCase()}`,
          completed: false,
          tab: item.category,
          priority: item.priority
        }))

        setProfileCompletion(completionItems)
        setCompletionPercentage(data.profileCompletion.score)

        // Set system status based on API data
        setSystemStatus({
          database: 'online',
          encryption: 'active',
          compliance: data.complianceStatus.kleinunternehmerStatus === 'active' ? 'konform' : 'prüfung'
        })

        setProfileData(data?.profile ?? null)
      } else {
        console.error('Failed to fetch settings overview')
        // Fallback to static data
        setStaticFallbackData()
      }
    } catch (error) {
      console.error('Error fetching settings overview:', error)
      setStaticFallbackData()
    } finally {
      setIsDataLoading(false)
    }
  }, [])

  // Only fetch overview data when overview tab is active
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSettingsOverview()
    }
  }, [activeTab, fetchSettingsOverview])

  const setStaticFallbackData = () => {
    setProfileData({
      businessName: null,
      businessAddress: null,
      businessEmail: null,
      vatStatus: 'KLEINUNTERNEHMER',
      certificates: []
    })
    setSystemStatus({
      database: 'online',
      encryption: 'active',
      compliance: 'konform'
    })
    setCompletionPercentage(20)

    const completionItems: ProfileCompletionItem[] = [
      {
        id: 'business-info',
        title: 'Business Information',
        description: 'Practice name and official address',
        completed: false,
        tab: 'profile',
        priority: 'high'
      },
      {
        id: 'tax-status',
        title: 'Tax Status',
        description: 'Small business or regular VAT',
        completed: true,
        tab: 'compliance',
        priority: 'high'
      }
    ]

    setProfileCompletion(completionItems)
  }

  // Use centralized tab configuration
  const settingsTabs = SETTINGS_TABS

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // Update URL without page refresh
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabId)
    window.history.pushState({}, '', url.toString())
  }

  const handleQuickAction = (tab: string) => {
    handleTabChange(tab)
  }

  // Loading component for Suspense
  const TabLoadingFallback = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <Home className="w-4 h-4" />
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-400">Dashboard</span>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-gray-900">Settings</span>
      </nav>

      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="text-lg text-gray-600">
          Manage your practice profile and Austrian compliance settings.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
          {settingsTabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={!tab.available}
                className="flex flex-col items-center space-y-1 p-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
                {tab.comingSoon && (
                  <span className="text-xs text-gray-400">({tab.comingSoon})</span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Tab Content with Suspense for lazy loading */}
        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<TabLoadingFallback />}>
            <OverviewTab
              profileCompletion={profileCompletion}
              completionPercentage={completionPercentage}
              onQuickAction={handleQuickAction}
              systemStatus={systemStatus}
              overviewData={overviewData}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <ErrorBoundary fallback={SettingsErrorFallback}>
            <Suspense fallback={<TabLoadingFallback />}>
              <ProfileTab isActive={activeTab === 'profile'} />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="travel" className="space-y-6">
          <ErrorBoundary fallback={SettingsErrorFallback}>
            <Suspense fallback={<TabLoadingFallback />}>
              <TravelTab isActive={activeTab === 'travel'} />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <ErrorBoundary fallback={SettingsErrorFallback}>
            <Suspense fallback={<TabLoadingFallback />}>
              <PricingTab isActive={activeTab === 'pricing'} />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ErrorBoundary fallback={SettingsErrorFallback}>
            <Suspense fallback={<TabLoadingFallback />}>
              <ComplianceTab isActive={activeTab === 'compliance'} />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <ErrorBoundary fallback={SettingsErrorFallback}>
            <Suspense fallback={<TabLoadingFallback />}>
              <SystemTab isActive={activeTab === 'system'} />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="text-center py-12">
            <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Export Features</h3>
            <p className="text-gray-600 mb-4">
              Data export and accounting integration will be available in version 1.8.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
