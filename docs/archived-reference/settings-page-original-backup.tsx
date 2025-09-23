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
  Label,
  Input,
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
  FileText,
  Plus,
  Edit3,
  Trash2,
  Tag,
  Timer,
  CreditCard,
  Receipt,
  BookOpen,
  Scale,
  BadgeCheck,
  Globe,
  Volume2,
  Calendar as CalendarIcon,
  Palette,
  Monitor,
  Smartphone,
  AlertTriangle,
  Server
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
  const [overviewData, setOverviewData] = useState<any>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)

  // Fetch settings overview data from API
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettingsOverview()
    }
  }, [status])

  const fetchSettingsOverview = async () => {
    try {
      setIsDataLoading(true)
      const response = await fetch('/api/settings/overview')
      if (response.ok) {
        const data = await response.json()
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

        // Set static profile data (will be replaced when profile API is implemented)
        setProfileData({
          businessName: null,
          businessAddress: null,
          businessEmail: null,
          vatStatus: 'KLEINUNTERNEHMER',
          certificates: []
        })
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
  }

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
      available: true
    },
    {
      id: 'travel',
      label: 'Location & Travel',
      icon: MapPin,
      description: 'Base location and travel configuration',
      available: true
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: DollarSign,
      description: 'Service rates and package deals',
      available: true
    },
    {
      id: 'system',
      label: 'System',
      icon: Bell,
      description: 'Language, notifications and formats',
      available: true
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

  if (status === 'loading' || isDataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 animate-spin text-[#1565C0]" />
          <div className="text-lg">Loading...</div>
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
              overviewData={overviewData}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileTab profileData={profileData} />
          </TabsContent>

          {/* Travel Settings Tab */}
          <TabsContent value="travel" className="space-y-6">
            <TravelSettingsTab profileData={profileData} />
          </TabsContent>

          {/* Pricing Settings Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <PricingSettingsTab profileData={profileData} />
          </TabsContent>

          {/* Compliance Settings Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <ComplianceSettingsTab profileData={profileData} overviewData={overviewData} />
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <SystemSettingsTab profileData={profileData} />
          </TabsContent>

          {/* Other tabs - placeholders for now */}
          {settingsTabs
            .filter(tab => !['overview', 'profile', 'travel', 'pricing', 'compliance', 'system'].includes(tab.id))
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
  systemStatus,
  overviewData
}: {
  profileCompletion: ProfileCompletionItem[]
  completionPercentage: number
  onQuickAction: (tab: string) => void
  systemStatus: any
  overviewData: any
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
      available: true
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
                  {overviewData ?
                    `${overviewData.profileCompletion.completedItems} von ${overviewData.profileCompletion.totalItems} Bereichen abgeschlossen` :
                    `${profileCompletion.filter(item => item.completed).length} von ${profileCompletion.length} Bereichen abgeschlossen`
                  }
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
                {t('settings.status.compliance', 'Compliance Status')}
              </span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  overviewData?.complianceStatus?.kleinunternehmerStatus === 'active' ? 'bg-green-500' :
                  overviewData?.complianceStatus?.kleinunternehmerStatus === 'threshold_warning' ? 'bg-orange-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm ${
                  overviewData?.complianceStatus?.kleinunternehmerStatus === 'active' ? 'text-green-600' :
                  overviewData?.complianceStatus?.kleinunternehmerStatus === 'threshold_warning' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {overviewData?.complianceStatus?.kleinunternehmerStatus === 'active' ? 'Konform' :
                   overviewData?.complianceStatus?.kleinunternehmerStatus === 'threshold_warning' ? 'Warnung' : 'Prüfung'}
                </span>
              </div>
            </div>
            {overviewData?.quickStats && (
              <>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Current Year Revenue</span>
                  <span className="text-sm font-medium text-gray-900">
                    €{overviewData.quickStats.currentYearRevenue.toLocaleString('de-AT')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kleinunternehmer Threshold</span>
                  <span className="text-sm text-gray-600">
                    {overviewData.quickStats.thresholdPercentage.toFixed(1)}% used
                  </span>
                </div>
              </>
            )}
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
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddressLine1: '',
    businessAddressLine2: '',
    businessCity: '',
    businessPostalCode: '',
    businessCountry: 'Austria',
    businessEmail: '',
    businessPhone: '',
    designation: 'HEILMASSEUR',
    licenseNumber: '',
    vatStatus: 'KLEINUNTERNEHMER'
  })

  // Fetch profile data
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/settings/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setFormData({
          businessName: data.profile.businessName || '',
          businessAddressLine1: data.profile.businessAddressLine1 || '',
          businessAddressLine2: data.profile.businessAddressLine2 || '',
          businessCity: data.profile.businessCity || '',
          businessPostalCode: data.profile.businessPostalCode || '',
          businessCountry: data.profile.businessCountry || 'Austria',
          businessEmail: data.profile.businessEmail || '',
          businessPhone: data.profile.businessPhone || '',
          designation: data.profile.designation || 'HEILMASSEUR',
          licenseNumber: data.profile.licenseNumber || '',
          vatStatus: data.profile.vatStatus || 'KLEINUNTERNEHMER'
        })
      } else {
        setError('Failed to load profile data')
      }
    } catch (err) {
      setError('Network error loading profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        // Show success message (you could add a toast here)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save profile')
      }
    } catch (err) {
      setError('Network error saving profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

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

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-name">Practice Name</Label>
                  <Input
                    id="business-name"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="Dr. Sarah Müller Physiotherapie"
                  />
                </div>
                <div>
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleChange('businessEmail', e.target.value)}
                    placeholder="praxis@example.at"
                  />
                </div>
                <div>
                  <Label htmlFor="business-phone">Business Phone</Label>
                  <Input
                    id="business-phone"
                    value={formData.businessPhone}
                    onChange={(e) => handleChange('businessPhone', e.target.value)}
                    placeholder="+43 732 123456"
                  />
                </div>
                <div>
                  <Label htmlFor="license-number">License Number</Label>
                  <Input
                    id="license-number"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    placeholder="HM-2025-001234"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address-line-1">Address Line 1</Label>
                  <Input
                    id="address-line-1"
                    value={formData.businessAddressLine1}
                    onChange={(e) => handleChange('businessAddressLine1', e.target.value)}
                    placeholder="Landstraße 15"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address-line-2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address-line-2"
                    value={formData.businessAddressLine2}
                    onChange={(e) => handleChange('businessAddressLine2', e.target.value)}
                    placeholder="Suite 201"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.businessCity}
                    onChange={(e) => handleChange('businessCity', e.target.value)}
                    placeholder="Linz"
                  />
                </div>
                <div>
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input
                    id="postal-code"
                    value={formData.businessPostalCode}
                    onChange={(e) => handleChange('businessPostalCode', e.target.value)}
                    placeholder="4020"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="designation">Professional Title</Label>
                  <select
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="HEILMASSEUR">Heilmasseur</option>
                    <option value="PHYSIOTHERAPEUT">Physiotherapeut</option>
                    <option value="FITNESSTRAINER">Fitnesstrainer</option>
                    <option value="OSTEOPATH">Osteopath</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="vat-status">VAT Status</Label>
                  <select
                    id="vat-status"
                    value={formData.vatStatus}
                    onChange={(e) => handleChange('vatStatus', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="KLEINUNTERNEHMER">Kleinunternehmer</option>
                    <option value="VAT_REGISTERED">VAT Registered</option>
                    <option value="VAT_EXEMPT">VAT Exempt</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={fetchProfile}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('settings.profile.current.title', 'Current Profile')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Practice Name</p>
                <p className="font-medium">
                  {profile?.businessName || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Business Address</p>
                <p className="font-medium">
                  {profile?.businessAddressLine1 && profile?.businessCity ?
                    `${profile.businessAddressLine1}, ${profile.businessPostalCode} ${profile.businessCity}` :
                    'Not configured'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">
                  {profile?.businessEmail || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Professional Title</p>
                <p className="font-medium">
                  {profile?.designation || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">VAT Status</p>
                <p className="font-medium">
                  {profile?.vatStatus === 'KLEINUNTERNEHMER' ? 'Small Business (Kleinunternehmer)' :
                   profile?.vatStatus === 'VAT_REGISTERED' ? 'VAT Registered' :
                   profile?.vatStatus === 'VAT_EXEMPT' ? 'VAT Exempt' : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">License Number</p>
                <p className="font-medium">
                  {profile?.licenseNumber || 'Not specified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Travel Settings Tab Component
function TravelSettingsTab({ profileData }: { profileData: any }) {
  const { t } = useTranslation()
  const [travelSettings, setTravelSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchTravelSettings()
  }, [])

  const fetchTravelSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings/travel')
      if (response.ok) {
        const data = await response.json()
        setTravelSettings(data)
      } else {
        console.error('Failed to fetch travel settings')
      }
    } catch (error) {
      console.error('Error fetching travel settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTravelSettings = async (updatedData: any) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/travel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        const result = await response.json()
        setTravelSettings(result.settings)
        console.log('Travel settings saved successfully')
      } else {
        console.error('Failed to save travel settings')
      }
    } catch (error) {
      console.error('Error saving travel settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 animate-spin text-[#1565C0]" />
          <div className="text-lg">Loading travel settings...</div>
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
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Location & Travel Settings</span>
            </CardTitle>
            <CardDescription>
              Configure your practice base location and travel service settings for Austrian client visits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Location Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span>Base Location</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base-address">Base Address</Label>
                  <Input
                    id="base-address"
                    placeholder="e.g., Hauptplatz 1"
                    value={travelSettings?.baseAddressLine1 || ''}
                    onChange={(e) => {
                      const updatedData = { baseAddressLine1: e.target.value }
                      setTravelSettings({ ...travelSettings, ...updatedData })
                    }}
                    onBlur={(e) => {
                      if (e.target.value !== travelSettings?.baseAddressLine1) {
                        handleSaveTravelSettings({ baseAddressLine1: e.target.value })
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city-postal">City & Postal Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="City"
                      value={travelSettings?.baseCity || ''}
                      onChange={(e) => {
                        const updatedData = { baseCity: e.target.value }
                        setTravelSettings({ ...travelSettings, ...updatedData })
                      }}
                      onBlur={(e) => {
                        if (e.target.value !== travelSettings?.baseCity) {
                          handleSaveTravelSettings({ baseCity: e.target.value })
                        }
                      }}
                    />
                    <Input
                      placeholder="Postal Code"
                      value={travelSettings?.basePostalCode || ''}
                      onChange={(e) => {
                        const updatedData = { basePostalCode: e.target.value }
                        setTravelSettings({ ...travelSettings, ...updatedData })
                      }}
                      onBlur={(e) => {
                        if (e.target.value !== travelSettings?.basePostalCode) {
                          handleSaveTravelSettings({ basePostalCode: e.target.value })
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Service Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Plane className="w-5 h-5" />
                <span>Travel Service Configuration</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-radius">Maximum Travel Distance (km)</Label>
                  <Input
                    id="service-radius"
                    type="number"
                    placeholder="50"
                    value={travelSettings?.maximumTravelDistanceKm || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      setTravelSettings({ ...travelSettings, maximumTravelDistanceKm: value })
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 50
                      if (value !== travelSettings?.maximumTravelDistanceKm) {
                        handleSaveTravelSettings({ maximumTravelDistanceKm: value })
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">Maximum distance for travel services</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travel-rate">Travel Rate (€/km)</Label>
                  <Input
                    id="travel-rate"
                    type="number"
                    step="0.01"
                    placeholder="0.80"
                    value={travelSettings?.ratePerKmCents ? (travelSettings.ratePerKmCents / 100).toFixed(2) : ''}
                    onChange={(e) => {
                      const value = Math.round(parseFloat(e.target.value) * 100) || 0
                      setTravelSettings({ ...travelSettings, ratePerKmCents: value })
                    }}
                    onBlur={(e) => {
                      const value = Math.round(parseFloat(e.target.value) * 100) || 80
                      if (value !== travelSettings?.ratePerKmCents) {
                        handleSaveTravelSettings({ ratePerKmCents: value })
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">Austrian standard: €0.80/km</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travel-buffer">Travel Buffer (minutes)</Label>
                  <Input
                    id="travel-buffer"
                    type="number"
                    placeholder="15"
                    value={travelSettings?.travelBufferMinutes || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      setTravelSettings({ ...travelSettings, travelBufferMinutes: value })
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 15
                      if (value !== travelSettings?.travelBufferMinutes) {
                        handleSaveTravelSettings({ travelBufferMinutes: value })
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">Extra time between appointments</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum-charge">Minimum Travel Charge (€)</Label>
                  <Input
                    id="minimum-charge"
                    type="number"
                    step="0.01"
                    placeholder="7.00"
                    value={travelSettings?.minimumTravelChargeCents ? (travelSettings.minimumTravelChargeCents / 100).toFixed(2) : ''}
                    onChange={(e) => {
                      const value = Math.round(parseFloat(e.target.value) * 100) || 0
                      setTravelSettings({ ...travelSettings, minimumTravelChargeCents: value })
                    }}
                    onBlur={(e) => {
                      const value = Math.round(parseFloat(e.target.value) * 100) || 700
                      if (value !== travelSettings?.minimumTravelChargeCents) {
                        handleSaveTravelSettings({ minimumTravelChargeCents: value })
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">Minimum charge for travel services</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport-method">Transport Method</Label>
                  <select
                    id="transport-method"
                    value={travelSettings?.transportMethod || 'CAR'}
                    onChange={(e) => {
                      setTravelSettings({ ...travelSettings, transportMethod: e.target.value })
                      handleSaveTravelSettings({ transportMethod: e.target.value })
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="CAR">Car</option>
                    <option value="BICYCLE">Bicycle</option>
                    <option value="PUBLIC_TRANSPORT">Public Transport</option>
                    <option value="WALKING">Walking</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                  </select>
                  <p className="text-xs text-gray-500">Primary method of transport</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Travel Settings Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Base Location</p>
              <p className="font-medium">
                {travelSettings?.baseAddressLine1 && travelSettings?.baseCity ?
                  `${travelSettings.baseAddressLine1}, ${travelSettings.basePostalCode} ${travelSettings.baseCity}` :
                  'Not configured'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Maximum Distance</p>
              <p className="font-medium">
                {travelSettings?.maximumTravelDistanceKm || 50} km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Travel Rate</p>
              <p className="font-medium">
                €{travelSettings?.ratePerKmCents ? (travelSettings.ratePerKmCents / 100).toFixed(2) : '0.80'}/km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transport Method</p>
              <p className="font-medium">
                {travelSettings?.transportMethod || 'Car'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Minimum Charge</p>
              <p className="font-medium">
                €{travelSettings?.minimumTravelChargeCents ? (travelSettings.minimumTravelChargeCents / 100).toFixed(2) : '7.00'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Austrian Travel Standards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-900">Standard Travel Rate</p>
              <p className="text-gray-600">€0.80/km (Austrian healthcare standard)</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Service Areas</p>
              <p className="text-gray-600">Upper Austria: 15-30km typical radius</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Travel Buffer</p>
              <p className="text-gray-600">15-20 minutes recommended between visits</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Pricing Settings Tab Component
function PricingSettingsTab({ profileData }: { profileData: any }) {
  const { t } = useTranslation()
  const [serviceRateTemplates, setServiceRateTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchServiceRates()
  }, [])

  const fetchServiceRates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings/pricing')
      if (response.ok) {
        const data = await response.json()
        setServiceRateTemplates(data)
      } else {
        console.error('Failed to fetch service rate templates')
      }
    } catch (error) {
      console.error('Error fetching service rate templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateServiceRate = async (serviceRateData: any) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceRateData),
      })

      if (response.ok) {
        const result = await response.json()
        setServiceRateTemplates(prev => [...prev, result.serviceRate])
        console.log('Service rate created successfully')
      } else {
        console.error('Failed to create service rate')
      }
    } catch (error) {
      console.error('Error creating service rate:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 animate-spin text-[#1565C0]" />
          <div className="text-lg">Loading pricing settings...</div>
        </div>
      </div>
    )
  }

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'MASSAGE': 'Massage',
      'YOGA': 'Yoga',
      'CONSULTING': 'Beratung',
      'OTHER': 'Sonstiges'
    }
    return categories[category] || category
  }

  const getVatLabel = (vatRate: string) => {
    const vatRates: Record<string, string> = {
      'KLEINUNTERNEHMER': '0% (Kleinunternehmer)',
      'UST_10': '10% (ermäßigt)',
      'UST_13': '13% (ermäßigt)',
      'UST_20': '20% (Normalsatz)'
    }
    return vatRates[vatRate] || vatRate
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Service Rate Templates</span>
            </CardTitle>
            <CardDescription>
              Manage default pricing for different service types. These templates will be used when creating new appointments and invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Template Section */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Your Service Templates</h3>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add New Template</span>
              </Button>
            </div>

            {/* Service Templates List */}
            <div className="space-y-4">
              {serviceRateTemplates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        {template.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Standard
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Category:</p>
                          <p className="font-medium flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>{getCategoryLabel(template.category)}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Price:</p>
                          <p className="font-medium flex items-center space-x-1">
                            <Euro className="w-3 h-3" />
                            <span>{formatPrice(template.priceCents)}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Duration:</p>
                          <p className="font-medium flex items-center space-x-1">
                            <Timer className="w-3 h-3" />
                            <span>{template.durationMin} min</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">VAT Rate:</p>
                          <p className="font-medium">{getVatLabel(template.vatRate)}</p>
                        </div>
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Pricing Settings */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Default Pricing Settings</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-vat">Default VAT Status</Label>
                  <select
                    id="default-vat"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="KLEINUNTERNEHMER"
                  >
                    <option value="KLEINUNTERNEHMER">Kleinunternehmer (0%)</option>
                    <option value="UST_10">10% (ermäßigt)</option>
                    <option value="UST_13">13% (ermäßigt)</option>
                    <option value="UST_20">20% (Normalsatz)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-duration">Default Session Duration</Label>
                  <select
                    id="default-duration"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="60"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button className="flex items-center space-x-2">
                <span>Save Pricing Settings</span>
              </Button>
              <Button variant="outline">Import from CSV</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Settings Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Pricing Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Service Templates</p>
              <p className="font-medium">{serviceRateTemplates.length} configured</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price Range</p>
              <p className="font-medium">
                €{Math.min(...serviceRateTemplates.map(t => t.priceCents / 100)).toFixed(2)} -
                €{Math.max(...serviceRateTemplates.map(t => t.priceCents / 100)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">VAT Status</p>
              <p className="font-medium">
                {profileData?.vatStatus === 'KLEINUNTERNEHMER' ? 'Kleinunternehmer' : 'Regular VAT'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Default Category</p>
              <p className="font-medium">Massage</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Austrian Pricing Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-900">Massage Therapy</p>
              <p className="text-gray-600">€60-90/hour typical range in Austria</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Kleinunternehmer Status</p>
              <p className="text-gray-600">No VAT charged under €55,000 annual revenue</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Travel Surcharge</p>
              <p className="text-gray-600">€0.80/km standard rate for home visits</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Session Length</p>
              <p className="text-gray-600">45-60 minutes most common</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Compliance Settings Tab Component
function ComplianceSettingsTab({ profileData, overviewData }: { profileData: any, overviewData: any }) {
  const { t } = useTranslation()
  const [taxComplianceData, setTaxComplianceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchTaxComplianceData()
  }, [])

  const fetchTaxComplianceData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings/tax-compliance')
      if (response.ok) {
        const data = await response.json()
        setTaxComplianceData(data)
      } else {
        console.error('Failed to fetch tax compliance data')
      }
    } catch (error) {
      console.error('Error fetching tax compliance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTaxCompliance = async (updatedData: any) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/tax-compliance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        const result = await response.json()
        setTaxComplianceData(result.settings)
        // Optionally show success message
        console.log('Tax compliance settings saved successfully')
      } else {
        console.error('Failed to save tax compliance settings')
      }
    } catch (error) {
      console.error('Error saving tax compliance settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Use API data if available, otherwise fallback to mock data
  const currentYearRevenue = overviewData?.quickStats?.currentYearRevenue || 42750
  const kleinunternehmerThreshold = overviewData?.quickStats?.kleinunternehmerThreshold || 55000
  const thresholdUsed = overviewData?.quickStats?.thresholdPercentage?.toFixed(1) || ((currentYearRevenue / kleinunternehmerThreshold) * 100).toFixed(1)
  const remainingAllowance = kleinunternehmerThreshold - currentYearRevenue

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 animate-spin text-[#1565C0]" />
          <div className="text-lg">Loading tax compliance settings...</div>
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
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Austrian Tax & Legal Compliance</span>
            </CardTitle>
            <CardDescription>
              Configure your Austrian tax settings, VAT status, and legal compliance requirements for therapy practices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Kleinunternehmer Status Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Scale className="w-5 h-5" />
                <span>Kleinunternehmer Status 2025</span>
              </h3>

              {/* Revenue Threshold Monitor */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Year-to-Date Revenue Monitor</h4>
                  <span className="text-2xl font-bold text-blue-600">
                    €{currentYearRevenue.toLocaleString('de-AT')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-300 ${
                      parseFloat(thresholdUsed) > 90 ? 'bg-red-500' :
                      parseFloat(thresholdUsed) > 75 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(parseFloat(thresholdUsed), 100)}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Threshold Used</p>
                    <p className="font-bold">{thresholdUsed}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining Allowance</p>
                    <p className="font-bold">€{remainingAllowance.toLocaleString('de-AT')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className={`font-bold ${
                      parseFloat(thresholdUsed) > 90 ? 'text-red-600' :
                      parseFloat(thresholdUsed) > 75 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {parseFloat(thresholdUsed) > 90 ? '⚠️ Near Limit' :
                       parseFloat(thresholdUsed) > 75 ? '⚠️ Monitor' : '✅ Safe'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat-status">VAT Status</Label>
                  <select
                    id="vat-status"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    value={taxComplianceData?.kleinunternehmerActive ? "KLEINUNTERNEHMER" : taxComplianceData?.vatRegistered ? "REGULAR" : "KLEINUNTERNEHMER"}
                    onChange={(e) => {
                      const newStatus = e.target.value
                      const updatedData = {
                        kleinunternehmerActive: newStatus === "KLEINUNTERNEHMER",
                        vatRegistered: newStatus === "REGULAR" || newStatus === "VOLUNTARY"
                      }
                      handleSaveTaxCompliance(updatedData)
                    }}
                  >
                    <option value="KLEINUNTERNEHMER">Kleinunternehmer (§ 6 Abs. 1 Z 27 UStG)</option>
                    <option value="REGULAR">Regular VAT Registration</option>
                    <option value="VOLUNTARY">Voluntary VAT Registration</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Current: {taxComplianceData?.kleinunternehmerActive ? 'Kleinunternehmer status active' : 'VAT registered'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-year">Tax Year</Label>
                  <select
                    id="tax-year"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="2025"
                  >
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                  <p className="text-xs text-gray-500">Revenue monitoring year</p>
                </div>
              </div>
            </div>

            {/* Austrian Tax Configuration */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Receipt className="w-5 h-5" />
                <span>Austrian Tax Configuration</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-registration">Business Registration Number</Label>
                  <Input
                    id="business-registration"
                    placeholder="e.g., 123456a"
                    defaultValue={profileData?.businessRegistrationNumber || ''}
                  />
                  <p className="text-xs text-gray-500">Gewerbeschein number (if applicable)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-number">Tax Number (Steuernummer)</Label>
                  <Input
                    id="tax-number"
                    placeholder="e.g., 12 123/4567"
                    defaultValue={profileData?.taxNumber || ''}
                  />
                  <p className="text-xs text-gray-500">Austrian tax office number</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uid-number">UID Number</Label>
                  <Input
                    id="uid-number"
                    placeholder="e.g., ATU12345678"
                    defaultValue={profileData?.uidNumber || ''}
                  />
                  <p className="text-xs text-gray-500">Only required for VAT registration</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-insurance">Social Insurance Number</Label>
                  <Input
                    id="social-insurance"
                    placeholder="e.g., 1234 010175"
                    defaultValue={profileData?.socialInsuranceNumber || ''}
                  />
                  <p className="text-xs text-gray-500">SVNR for ÖGK billing (optional)</p>
                </div>
              </div>
            </div>

            {/* Professional Designation */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <BadgeCheck className="w-5 h-5" />
                <span>Professional Designation</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Official Designation</Label>
                  <select
                    id="designation"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="HEILMASSEUR"
                  >
                    <option value="HEILMASSEUR">Heilmasseur/in</option>
                    <option value="PHYSIOTHERAPEUT">Physiotherapeut/in</option>
                    <option value="MASSEUR">Masseur/in</option>
                    <option value="GEWERBLICHER_MASSEUR">Gewerblicher Masseur/in</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="license-number">License Number</Label>
                  <Input
                    id="license-number"
                    placeholder="e.g., HM-2025-001234"
                    defaultValue={profileData?.licenseNumber || ''}
                  />
                  <p className="text-xs text-gray-500">Professional license number</p>
                </div>
              </div>
            </div>

            {/* RKSV Cash Register Compliance */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>Registrierkassenpflicht (RKSV) 2025</span>
              </h3>

              {/* Cash Register Threshold Monitor */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Cash Register Obligation Monitor</h4>
                  <div className="flex items-center space-x-2">
                    {currentYearRevenue > 15000 ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <span className="text-lg font-bold text-gray-900">
                      {currentYearRevenue > 15000 ? 'RKSV Required' : 'Below Threshold'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Annual Revenue Threshold</p>
                    <p className="font-bold">€15,000 (current: €{currentYearRevenue.toLocaleString('de-AT')})</p>
                    <p className="text-xs text-gray-500">
                      {currentYearRevenue > 15000 ? '⚠️ Threshold exceeded' : '✅ Below threshold'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cash Transaction Threshold</p>
                    <p className="font-bold">€7,500 (estimated: €{Math.round(currentYearRevenue * 0.7).toLocaleString('de-AT')})</p>
                    <p className="text-xs text-gray-500">
                      {(currentYearRevenue * 0.7) > 7500 ? '⚠️ Likely exceeded' : '✅ Estimated below threshold'}
                    </p>
                  </div>
                </div>

                {currentYearRevenue > 15000 && (
                  <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-800">Cash Register Required</p>
                        <p className="text-orange-700">
                          Your revenue exceeds €15,000. If cash/card transactions exceed €7,500,
                          you must implement an RKSV-compliant cash register system within 4 months
                          of exceeding thresholds.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rksv-status">RKSV Cash Register Status</Label>
                  <select
                    id="rksv-status"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue={currentYearRevenue > 15000 ? "REQUIRED" : "NOT_REQUIRED"}
                  >
                    <option value="NOT_REQUIRED">Not Required (Below €15k + €7.5k)</option>
                    <option value="REQUIRED">Required (Above Thresholds)</option>
                    <option value="IMPLEMENTED">RKSV System Implemented</option>
                    <option value="PENDING">Implementation Pending</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cash-register-type">Cash Register System</Label>
                  <select
                    id="cash-register-type"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="NONE"
                  >
                    <option value="NONE">No Cash Register</option>
                    <option value="PHYSICAL">Physical RKSV Cash Register</option>
                    <option value="SOFTWARE">Software-based RKSV Solution</option>
                    <option value="MOBILE">Mobile RKSV App</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signature-card">RKSV Signature Card</Label>
                  <Input
                    id="signature-card"
                    placeholder="e.g., ACOS-ID 2.1"
                    defaultValue=""
                  />
                  <p className="text-xs text-gray-500">
                    ⚠️ ACOS-ID 2.1 cards expire June 7, 2025 - replacement required
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-office-registration">Tax Office Registration</Label>
                  <Input
                    id="tax-office-registration"
                    placeholder="Registration confirmation number"
                    defaultValue=""
                  />
                  <p className="text-xs text-gray-500">Required since 2025 for RKSV systems</p>
                </div>
              </div>

              {/* RKSV Information Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                  <Server className="w-4 h-4" />
                  <span>RKSV Key Requirements 2025</span>
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Thresholds:</strong> €15,000 annual revenue AND €7,500 cash/card transactions</li>
                  <li>• <strong>Implementation:</strong> Required within 4 months of exceeding thresholds</li>
                  <li>• <strong>What counts as cash:</strong> Cash, debit/credit cards, vouchers (on-site payments)</li>
                  <li>• <strong>Excluded:</strong> Bank transfers, online payments, PayPal transactions</li>
                  <li>• <strong>Mobile services:</strong> Manual receipts allowed, enter in office cash register</li>
                  <li>• <strong>Penalties:</strong> Up to €5,000 for non-compliance</li>
                  <li>• <strong>2025 Update:</strong> Cash registers must be registered with tax office</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                className="flex items-center space-x-2"
                disabled={isSaving}
                onClick={() => {
                  // Save any pending form changes
                  console.log('Saving compliance settings...')
                }}
              >
                {isSaving ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : null}
                <span>{isSaving ? 'Saving...' : 'Save Compliance Settings'}</span>
              </Button>
              <Button variant="outline">Generate Compliance Report</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">VAT Status</p>
              <p className="font-medium">
                {profileData?.vatStatus === 'KLEINUNTERNEHMER' ? '✅ Kleinunternehmer' : '⚠️ Regular VAT'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">2025 Revenue</p>
              <p className="font-medium">€{currentYearRevenue.toLocaleString('de-AT')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Professional License</p>
              <p className="font-medium">
                {profileData?.licenseNumber ? '✅ Registered' : '⚠️ Pending'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tax Registration</p>
              <p className="font-medium">
                {profileData?.taxNumber ? '✅ Complete' : '⚠️ Required'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">RKSV Cash Register</p>
              <p className="font-medium">
                {currentYearRevenue > 15000 ? '⚠️ Required' : '✅ Not Required'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Austrian Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-900">Kleinunternehmer Threshold</p>
              <p className="text-gray-600">€55,000 annual revenue limit for 2025</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Invoice Requirements</p>
              <p className="text-gray-600">Sequential numbering, VAT notice mandatory</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">GDPR Compliance</p>
              <p className="text-gray-600">Patient data encryption, consent tracking</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Professional License</p>
              <p className="text-gray-600">Required for health service provision</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">RKSV Cash Register</p>
              <p className="text-gray-600">Required above €15k revenue + €7.5k cash transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <BookOpen className="w-4 h-4 mr-2" />
              Austrian Tax Guide
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <CreditCard className="w-4 h-4 mr-2" />
              VAT Calculator
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Compliance Checklist
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// System Settings Tab Component
function SystemSettingsTab({ profileData }: { profileData: any }) {
  const { t } = useTranslation()
  const [systemSettings, setSystemSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSystemSettings()
  }, [])

  const fetchSystemSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings/system')
      if (response.ok) {
        const data = await response.json()
        setSystemSettings(data)
      } else {
        console.error('Failed to fetch system settings')
      }
    } catch (error) {
      console.error('Error fetching system settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSystemSettings = async (updatedData: any) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        const result = await response.json()
        setSystemSettings(result.preferences)
        console.log('System settings saved successfully')
      } else {
        console.error('Failed to save system settings')
      }
    } catch (error) {
      console.error('Error saving system settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 animate-spin text-[#1565C0]" />
          <div className="text-lg">Loading system settings...</div>
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
              <Bell className="w-5 h-5 text-purple-600" />
              <span>System Settings</span>
            </CardTitle>
            <CardDescription>
              Configure language preferences, notifications, data formats, and system-wide settings for your MyoFlow practice management.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language & Localization */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Language & Localization</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interface-language">Interface Language</Label>
                  <select
                    id="interface-language"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    value={systemSettings?.language === 'DE' ? 'de' : 'en'}
                    onChange={(e) => {
                      const language = e.target.value === 'de' ? 'DE' : 'EN'
                      setSystemSettings({ ...systemSettings, language })
                      handleSaveSystemSettings({ language })
                    }}
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch (German)</option>
                  </select>
                  <p className="text-xs text-gray-500">Language for menus and interface text</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region/Country</Label>
                  <select
                    id="region"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="AT"
                  >
                    <option value="AT">Austria (Österreich)</option>
                    <option value="DE">Germany (Deutschland)</option>
                    <option value="CH">Switzerland (Schweiz)</option>
                  </select>
                  <p className="text-xs text-gray-500">Affects date formats and legal requirements</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <select
                    id="date-format"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="DD.MM.YYYY"
                  >
                    <option value="DD.MM.YYYY">DD.MM.YYYY (Austrian)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <select
                    id="time-format"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="24h"
                  >
                    <option value="24h">24-hour (14:30)</option>
                    <option value="12h">12-hour (2:30 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Volume2 className="w-5 h-5" />
                <span>Notification Preferences</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Appointment Reminders</p>
                    <p className="text-sm text-gray-600">Email notifications for upcoming appointments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Payment Notifications</p>
                    <p className="text-sm text-gray-600">Alerts when invoices are paid</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">System Updates</p>
                    <p className="text-sm text-gray-600">Feature updates and maintenance notices</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Revenue Threshold Alerts</p>
                    <p className="text-sm text-gray-600">Warnings when approaching Kleinunternehmer limit</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Calendar & Scheduling */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Calendar & Scheduling</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work-week">Working Week</Label>
                  <select
                    id="work-week"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="mon-fri"
                  >
                    <option value="mon-fri">Monday - Friday</option>
                    <option value="mon-sat">Monday - Saturday</option>
                    <option value="tue-sat">Tuesday - Saturday</option>
                    <option value="custom">Custom Schedule</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-hours">Default Working Hours</Label>
                  <select
                    id="work-hours"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="9-17"
                  >
                    <option value="8-16">08:00 - 16:00</option>
                    <option value="9-17">09:00 - 17:00</option>
                    <option value="10-18">10:00 - 18:00</option>
                    <option value="custom">Custom Hours</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-duration">Default Appointment Duration</Label>
                  <select
                    id="default-duration"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="60"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buffer-time">Buffer Between Appointments</Label>
                  <select
                    id="buffer-time"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    defaultValue="15"
                  >
                    <option value="0">No buffer</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                className="flex items-center space-x-2"
                disabled={isSaving}
                onClick={() => {
                  console.log('Manual save triggered')
                }}
              >
                {isSaving ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : null}
                <span>{isSaving ? 'Saving...' : 'Save System Settings'}</span>
              </Button>
              <Button variant="outline">Reset to Defaults</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Settings Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Interface Language</p>
              <p className="font-medium">English</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Region</p>
              <p className="font-medium">Austria</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date Format</p>
              <p className="font-medium">DD.MM.YYYY</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Format</p>
              <p className="font-medium">24-hour</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Working Hours</p>
              <p className="font-medium">09:00 - 17:00</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Notifications</p>
              <p className="font-medium">3 of 4 enabled</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-900">MyoFlow Version</p>
              <p className="text-gray-600">v1.7.0 (September 2025)</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Last Update</p>
              <p className="text-gray-600">September 19, 2025</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Database</p>
              <p className="text-gray-600">✅ Online & Healthy</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Backup Status</p>
              <p className="text-gray-600">✅ Daily backups active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Monitor className="w-4 h-4 mr-2" />
              Display Settings
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Palette className="w-4 h-4 mr-2" />
              Theme Preferences
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export Settings
            </Button>
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