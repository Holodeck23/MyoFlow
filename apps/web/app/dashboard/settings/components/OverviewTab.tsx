'use client'

import { useTranslation } from '@myoflow/lib'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  cn
} from '@/components/ui'
import {
  User,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Euro,
  FileText,
  Languages
} from 'lucide-react'

interface ProfileCompletionItem {
  id: string
  title: string
  description: string
  completed: boolean
  tab: string
  priority: 'high' | 'medium' | 'low'
}

interface OverviewTabProps {
  profileCompletion: ProfileCompletionItem[]
  completionPercentage: number
  onQuickAction: (tab: string) => void
  systemStatus: any
  overviewData: any
  isLoading?: boolean
}

export function OverviewTab({
  profileCompletion,
  completionPercentage,
  onQuickAction,
  systemStatus,
  overviewData,
  isLoading = false
}: OverviewTabProps) {
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
                {isLoading ? (
                  <>
                    <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      {completionPercentage}% {t('settings.completion.complete', 'vollständig')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {overviewData ? (
                        <>
                          {overviewData.profileCompletion.completedItems} {t('settings.completion.of', 'von')} {overviewData.profileCompletion.totalItems} {t('settings.completion.areasCompleted', 'Bereichen abgeschlossen')}
                        </>
                      ) : (
                        <>
                          {profileCompletion.filter(item => item.completed).length} {t('settings.completion.of', 'von')} {profileCompletion.length} {t('settings.completion.areasCompleted', 'Bereichen abgeschlossen')}
                        </>
                      )}
                    </p>
                  </>
                )}
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
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
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
                    "cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200",
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
        <Card className="border-gray-200">
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
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {t('settings.help.title', 'Hilfe & Support')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start border-gray-200"
              asChild
            >
              <a href="https://github.com/yourusername/MyoFlow/blob/main/docs/user-guide.md" target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                {t('settings.help.documentation', 'Dokumentation')}
              </a>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-gray-200"
              asChild
            >
              <a href="mailto:support@myoflow.at">
                <Languages className="w-4 h-4 mr-2" />
                {t('settings.help.support', 'Support kontaktieren')}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}