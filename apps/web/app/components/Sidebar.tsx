'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@myoflow/lib'
import {
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  Bug
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const navigation = [
    { name: t('sidebar.dashboard', 'Dashboard'), href: '/dashboard', icon: Home, gradient: 'from-emerald-400 to-emerald-500' },
    { name: t('sidebar.clients', 'Klienten'), href: '/dashboard/clients', icon: Users, gradient: 'from-sky-400 to-sky-500' },
    { name: t('sidebar.appointments', 'Termine'), href: '/dashboard/appointments', icon: Calendar, gradient: 'from-violet-400 to-violet-500' },
    { name: t('sidebar.invoices', 'Rechnungen'), href: '/dashboard/invoices', icon: FileText, gradient: 'from-amber-400 to-amber-500' },
    { name: t('sidebar.settings', 'Einstellungen'), href: '/dashboard/settings', icon: Settings, gradient: 'from-slate-400 to-slate-500' },
  ]

  return (
    <div className="flex min-h-screen w-16 flex-col bg-medical-blue">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center">
        <div className="h-12 w-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center p-2 shadow-lg border border-white/20">
          <img
            src="/shield-logo.png"
            alt="MyoFlow Logo"
            className="h-9 w-9 object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center space-y-3 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const IconComponent = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl
                ${isActive
                  ? 'bg-gradient-to-br from-white to-gray-100 text-medical-blue scale-110 shadow-2xl'
                  : `bg-gradient-to-br ${item.gradient} text-white hover:scale-105 hover:shadow-2xl`
                }
              `}
              title={item.name}
            >
              <IconComponent size={24} />
            </Link>
          )
        })}
      </nav>

      {/* Bug Report Button */}
      <div className="pb-6 flex justify-center">
        <button
          onClick={() => window.open('mailto:bugs@myoflow.at?subject=Bug Report&body=Describe the issue here...', '_blank')}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white hover:scale-105 hover:shadow-xl transition-all duration-200 shadow-lg"
          title="Bug melden"
          style={{ backgroundColor: '#DC2626' }}
        >
          <Bug size={20} />
        </button>
      </div>
    </div>
  )
}