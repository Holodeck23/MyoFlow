'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/app/components/Sidebar'
import { Button } from '@/components/ui/Button'
import { Languages, Facebook, Twitter, Instagram, Linkedin, Mail, LogOut } from 'lucide-react'
import { useLocale, useTranslation } from '@myoflow/lib'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading', 'Loading...')}</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Compact Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex justify-end items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session.user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {session.user?.name || t('dashboardLayout.user.fallbackName', 'Therapeut')}
                </div>
                <div className="text-xs text-gray-500">
                  {session.user?.email}
                </div>
              </div>
            </div>

            <LanguageToggle />

            <Button
              onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
              variant="outline"
              size="sm"
              title={t('auth.signOut', 'Abmelden')}
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">{t('auth.signOut', 'Abmelden')}</span>
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-8 bg-gray-50">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

function LanguageToggle() {
  const { locale, setLocale, isLoading } = useLocale()
  const { t } = useTranslation()

  const toggleLanguage = () => {
    const nextLocale = locale === 'de' ? 'en' : 'de'
    setLocale(nextLocale)
  }

  return (
    <Button
      onClick={toggleLanguage}
      variant="ghost"
      size="sm"
      className="bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      disabled={isLoading}
      title={t('dashboardLayout.languageToggle', 'Sprache wechseln / Switch language')}
    >
      <Languages size={16} />
      <span className="text-sm font-medium">{locale.toUpperCase()}</span>
    </Button>
  )
}

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 px-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="MyoFlow" className="h-6 w-6" />
            <span className="font-semibold text-gray-900">MyoFlow</span>
          </div>
          <p className="text-sm text-gray-600">{t('dashboardLayout.footer.tagline', 'Österreichische Therapiepraxis-Management-Software')}</p>

          {/* Social Links */}
          <div className="flex items-center space-x-3">
            <a href="#" className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors" title="Facebook">
              <Facebook size={16} />
            </a>
            <a href="#" className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors" title="Twitter">
              <Twitter size={16} />
            </a>
            <a href="#" className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors" title="Instagram">
              <Instagram size={16} />
            </a>
            <a href="#" className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors" title="LinkedIn">
              <Linkedin size={16} />
            </a>
            <a href="mailto:support@myoflow.at" className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors" title="Email">
              <Mail size={16} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('dashboardLayout.footer.sections.product.title', 'Produkt')}</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.product.features', 'Features')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.product.pricing', 'Preise')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.product.faq', 'FAQ')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('dashboardLayout.footer.sections.support.title', 'Support')}</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.support.helpCenter', 'Hilfe Center')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.support.contact', 'Kontakt')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.support.status', 'Status')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('dashboardLayout.footer.sections.legal.title', 'Legal')}</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.legal.privacy', 'Datenschutz')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.legal.terms', 'AGB')}</a></li>
              <li><a href="#" className="hover:text-blue-600">{t('dashboardLayout.footer.sections.legal.imprint', 'Impressum')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('dashboardLayout.footer.sections.compliance.title', 'Compliance')}</h3>
            <ul className="space-y-1 text-gray-600">
              <li><span className="text-green-600">✓ {t('dashboardLayout.footer.sections.compliance.gdpr', 'GDPR')}</span></li>
              <li><span className="text-green-600">✓ {t('dashboardLayout.footer.sections.compliance.vat', 'Österreichische VAT')}</span></li>
              <li><span className="text-green-600">✓ {t('dashboardLayout.footer.sections.compliance.smallBusiness', 'Kleinunternehmer')}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-200 mt-6 pt-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
        <p className="text-xs text-gray-500">
          {t('dashboardLayout.footer.copyright', '© 2025 MyoFlow. Alle Rechte vorbehalten. Made in Austria 🇦🇹')}
        </p>
        <p className="text-xs text-gray-500">
          {t('dashboardLayout.footer.version', 'Version 1.6.0 • Letzte Aktualisierung: September 2025')}
        </p>
      </div>
    </footer>
  )
}
