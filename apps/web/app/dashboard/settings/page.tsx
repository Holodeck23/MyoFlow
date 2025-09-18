'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from '@myoflow/lib'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  cn
} from '@/components/ui'
import {
  User,
  Shield,
  MapPin,
  DollarSign,
  Settings as SettingsIcon,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Home,
  Building2,
  Euro,
  Calculator,
  Plane,
  Bell,
  Languages,
  FileText
} from 'lucide-react'

interface SettingsTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  available: boolean
  comingSoon?: string
}

interface ProfileCompletionItem {
  id: string
  title: string
  description: string
  completed: boolean
  tab: string
  priority: 'high' | 'medium' | 'low'
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  
  // Get initial tab from URL params or default to overview
  const initialTab = searchParams?.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }
  }, [status, router])

  // State for profile data
  const [profileData, setProfileData] = useState<any>(null)
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionItem[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [systemStatus, setSystemStatus] = useState<any>(null)

  // Initialize with static data to prevent infinite loop
  useEffect(() => {
    if (status === 'authenticated' && !profileData) {
      // Set static mock data to prevent infinite loop
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
        },
        {
          id: 'base-location',
          title: 'Location Settings',
          description: 'Base address for travel calculations',
          completed: false,
          tab: 'travel',
          priority: 'high'
        },
        {
          id: 'service-rates',
          title: 'Service Pricing',
          description: 'Price templates for your services',
          completed: true,
          tab: 'pricing',
          priority: 'medium'
        },
        {
          id: 'credentials',
          title: 'Qualifications',
          description: 'Professional certificates and licenses',
          completed: false,
          tab: 'profile',
          priority: 'medium'
        }
      ]

      setProfileCompletion(completionItems)
      setIsLoading(false)
    }
  }, [status, profileData])

  const settingsTabs: SettingsTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: SettingsIcon,
      description: 'Profile status and quick actions',
      available: true
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Business information and qualifications',
      available: true
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      description: 'Austrian tax and legal compliance',
      available: false,
      comingSoon: 'v1.7'
    },
    {
      id: 'travel',
      label: 'Location & Travel',
      icon: MapPin,
      description: 'Base location and travel configuration',
      available: false,
      comingSoon: 'v1.7'
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: DollarSign,
      description: 'Service rates and package deals',
      available: false,
      comingSoon: 'v1.7'
    },
    {
      id: 'system',
      label: 'System',
      icon: Bell,
      description: 'Language, notifications and formats',
      available: false,
      comingSoon: 'v1.7'
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      description: 'Data export and accounting integration',
      available: false,
      comingSoon: 'v1.8'
    }
  ]

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 animate-spin text-[#1565C0]" />
          <div className="text-lg">{t('common.loading', 'Wird geladen...')}</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

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
        {/* Desktop Tab Navigation */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex bg-gray-100 p-1 rounded-lg">
            {settingsTabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={!tab.available}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200",
                    "data-[state=active]:bg-white data-[state=active]:text-[#1565C0] data-[state=active]:shadow-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    !tab.available && "relative"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden lg:inline">{tab.label}</span>
                  {!tab.available && tab.comingSoon && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded-full">
                      {tab.comingSoon}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden">
          <select
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
          >
            {settingsTabs
              .filter(tab => tab.available)
              .map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
          </select>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab
              profileCompletion={profileCompletion}
              completionPercentage={completionPercentage}
              onQuickAction={handleQuickAction}
              systemStatus={systemStatus}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileTab profileData={profileData} />
          </TabsContent>

          {/* Other tabs - placeholders for now */}
          {settingsTabs
            .filter(tab => tab.id !== 'overview' && tab.id !== 'profile')
            .map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                <ComingSoonTab tab={tab} />
              </TabsContent>
            ))}
        </div>
      </Tabs>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({
  profileCompletion,
  completionPercentage,
  onQuickAction,
  systemStatus
}: {
  profileCompletion: ProfileCompletionItem[]
  completionPercentage: number
  onQuickAction: (tab: string) => void
  systemStatus: any
}) {
  const { t } = useTranslation()

  const quickActions = [
    {
      icon: User,
      title: t('settings.quickActions.profile', 'Profil bearbeiten'),
      description: t('settings.quickActions.profileDesc', 'Geschäftsdaten aktualisieren'),
      tab: 'profile',
      available: true
    },
    {
      icon: Euro,
      title: t('settings.quickActions.pricing', 'Preise anpassen'),
      description: t('settings.quickActions.pricingDesc', 'Behandlungspreise verwalten'),
      tab: 'pricing',
      available: false
    },
    {
      icon: Download,
      title: t('settings.quickActions.export', 'Daten exportieren'),
      description: t('settings.quickActions.exportDesc', 'BMD/RZL Export erstellen'),
      tab: 'export',
      available: false
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Completion Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span>{t('settings.completion.title', 'Profil-Vollständigkeit')}</span>
            </CardTitle>
            <CardDescription>
              {t('settings.completion.description', 'Vervollständigen Sie Ihr Profil für optimale Nutzung')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Display */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-full border-8 border-gray-200"></div>
                <div 
                  className="absolute top-0 left-0 w-20 h-20 rounded-full border-8 border-green-500 border-t-transparent transform -rotate-90"
                  style={{
                    background: `conic-gradient(from 0deg, #10b981 ${completionPercentage * 3.6}deg, transparent ${completionPercentage * 3.6}deg)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{completionPercentage}%</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completionPercentage}% vollständig</p>
                <p className="text-sm text-gray-600">
                  {profileCompletion.filter(item => item.completed).length} von {profileCompletion.length} Bereichen abgeschlossen
                </p>
              </div>
            </div>

            {/* Missing Items */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                {t('settings.completion.missingTitle', 'Noch zu erledigen:')}
              </h4>
              {profileCompletion
                .filter(item => !item.completed)
                .slice(0, 3)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => onQuickAction(item.tab)}
                  >
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('settings.quickActions.title', 'Schnellaktionen')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Card
                  key={action.tab}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    action.available 
                      ? "hover:border-blue-300" 
                      : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => action.available && onQuickAction(action.tab)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{action.title}</p>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('settings.status.title', 'System-Status')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t('settings.status.database', 'Datenbank')}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">
                  {systemStatus?.database === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t('settings.status.encryption', 'Verschlüsselung')}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">
                  {systemStatus?.encryption === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t('settings.status.compliance', 'GDPR Compliance')}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">
                  {systemStatus?.compliance === 'konform' ? 'Konform' : 'Prüfung'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('settings.help.title', 'Hilfe & Support')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              {t('settings.help.documentation', 'Dokumentation')}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Languages className="w-4 h-4 mr-2" />
              {t('settings.help.support', 'Support kontaktieren')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Profile Tab Component
function ProfileTab({ profileData }: { profileData: any }) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile.title', 'Profil-Einstellungen')}</CardTitle>
            <CardDescription>
              {t('settings.profile.description', 'Verwalten Sie Ihre Geschäftsdaten und professionellen Qualifikationen.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('settings.profile.placeholder.title', 'Profil-Verwaltung')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('settings.profile.placeholder.description', 'Die Profil-Verwaltung wird in einer kommenden Version implementiert.')}
              </p>
              <Button variant="outline" disabled>
                {t('settings.profile.placeholder.button', 'Bald verfügbar')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('settings.profile.current.title', 'Aktuelles Profil')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Praxisname</p>
                <p className="font-medium">
                  {profileData?.businessName || 'Noch nicht konfiguriert'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Geschäftsadresse</p>
                <p className="font-medium">
                  {profileData?.businessAddress || 'Noch nicht konfiguriert'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">E-Mail</p>
                <p className="font-medium">
                  {profileData?.businessEmail || 'Noch nicht konfiguriert'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Berufsbezeichnung</p>
                <p className="font-medium">
                  {profileData?.designation || 'HEILMASSEUR'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">MwSt.-Status</p>
                <p className="font-medium">
                  {profileData?.vatStatus === 'KLEINUNTERNEHMER' ? 'Kleinunternehmer' : 'Regulär'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Qualifikationen</p>
                <p className="font-medium">
                  {profileData?.certificates?.length > 0
                    ? `${profileData.certificates.length} Zertifikat(e)`
                    : 'Noch nicht konfiguriert'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Coming Soon Tab Component
function ComingSoonTab({ tab }: { tab: SettingsTab }) {
  const { t } = useTranslation()
  const IconComponent = tab.icon

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="pt-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{tab.label}</h3>
          <p className="text-gray-600 mb-4">{tab.description}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
            <Clock className="w-4 h-4 mr-1" />
            {tab.comingSoon && `Verfügbar in ${tab.comingSoon}`}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
