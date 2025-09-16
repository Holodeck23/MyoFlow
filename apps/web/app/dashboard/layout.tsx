'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/app/components/Sidebar'
import { Button } from '@/components/ui/Button'
import { Languages, Facebook, Twitter, Instagram, Linkedin, Mail, LogOut } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

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
        {/* Professional Austrian Medical Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Austrian Medical Cross Logo */}
              <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4H6v-2h4V7h4v4h4v2h-4v4z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">MyoFlow Praxis</h1>
                <p className="text-sm text-gray-600">
                  Österreichische Therapie-Verwaltung
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {session.user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {session.user?.name || 'Therapeut'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.user?.email}
                  </div>
                </div>
              </div>

              {/* Language Toggle */}
              <LanguageToggle />

              {/* Logout Button */}
              <Button
                onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
                variant="outline"
                size="sm"
                title="Abmelden"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Abmelden</span>
              </Button>
            </div>
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
  const [language, setLanguage] = useState('de')
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem('myoflow-language')
    if (saved && (saved === 'de' || saved === 'en')) {
      setLanguage(saved)
    }
  }, [])

  const toggleLanguage = () => {
    if (!isClient) return

    const newLang = language === 'de' ? 'en' : 'de'
    setLanguage(newLang)
    localStorage.setItem('myoflow-language', newLang)

    // Force a page reload to apply language changes
    window.location.reload()
  }

  if (!isClient) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 text-white/80">
        <Languages size={16} />
        <span className="text-sm font-medium">DE</span>
      </div>
    )
  }

  return (
    <Button
      onClick={toggleLanguage}
      variant="ghost"
      size="sm"
      className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
      title="Sprache wechseln / Switch language"
    >
      <Languages size={16} />
      <span className="text-sm font-medium">{language.toUpperCase()}</span>
    </Button>
  )
}

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 px-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="MyoFlow" className="h-6 w-6" />
            <span className="font-semibold text-gray-900">MyoFlow</span>
          </div>
          <p className="text-sm text-gray-600">Österreichische Therapiepraxis-Management-Software</p>

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
            <h3 className="font-semibold text-gray-900 mb-2">Produkt</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600">Features</a></li>
              <li><a href="#" className="hover:text-blue-600">Preise</a></li>
              <li><a href="#" className="hover:text-blue-600">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600">Hilfe Center</a></li>
              <li><a href="#" className="hover:text-blue-600">Kontakt</a></li>
              <li><a href="#" className="hover:text-blue-600">Status</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Legal</h3>
            <ul className="space-y-1 text-gray-600">
              <li><a href="#" className="hover:text-blue-600">Datenschutz</a></li>
              <li><a href="#" className="hover:text-blue-600">AGB</a></li>
              <li><a href="#" className="hover:text-blue-600">Impressum</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Compliance</h3>
            <ul className="space-y-1 text-gray-600">
              <li><span className="text-green-600">✓ GDPR</span></li>
              <li><span className="text-green-600">✓ Österreichische VAT</span></li>
              <li><span className="text-green-600">✓ Kleinunternehmer</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-200 mt-6 pt-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
        <p className="text-xs text-gray-500">
          © 2025 MyoFlow. Alle Rechte vorbehalten. Made in Austria 🇦🇹
        </p>
        <p className="text-xs text-gray-500">
          Version 1.6.0 • Letzte Aktualisierung: September 2025
        </p>
      </div>
    </footer>
  )
}