'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/app/components/Sidebar'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { Facebook, Twitter, Instagram, Linkedin, Mail, LogOut } from 'lucide-react'
import { useTranslation } from '@myoflow/lib'

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
        <div className="text-lg">Loading...</div>
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
                  {session.user?.name || t('dashboardLayout.user.fallbackName')}
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
              title={t('auth.signOut')}
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">{t('auth.signOut')}</span>
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
          <p className="text-sm text-gray-600 max-w-xs truncate">{t('dashboardLayout.footer.tagline')}</p>

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm min-w-0 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2 truncate">{t('dashboardLayout.footer.sections.product.title')}</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.product.features')}</a></li>
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.product.pricing')}</a></li>
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.product.faq')}</a></li>
            </ul>
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2 truncate">{t('dashboardLayout.footer.sections.support.title')}</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.support.helpCenter')}</a></li>
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.support.contact')}</a></li>
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.support.status')}</a></li>
            </ul>
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2 truncate">{t('dashboardLayout.footer.sections.legal.title')}</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.legal.privacy')}</a></li>
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.legal.terms')}</a></li>
              <li><a href="#" className="hover:text-blue-600 block truncate">{t('dashboardLayout.footer.sections.legal.imprint')}</a></li>
            </ul>
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2 truncate">{t('dashboardLayout.footer.sections.compliance.title')}</h3>
            <ul className="space-y-1 text-gray-600">
              <li><span className="text-green-600 block truncate">✓ {t('dashboardLayout.footer.sections.compliance.gdpr')}</span></li>
              <li><span className="text-green-600 block truncate">✓ {t('dashboardLayout.footer.sections.compliance.vat')}</span></li>
              <li><span className="text-green-600 block truncate">✓ {t('dashboardLayout.footer.sections.compliance.smallBusiness')}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-200 mt-6 pt-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
        <p className="text-xs text-gray-500">
          {t('dashboardLayout.footer.copyright')}
        </p>
        <p className="text-xs text-gray-500">
          {t('dashboardLayout.footer.version')}
        </p>
      </div>
    </footer>
  )
}
