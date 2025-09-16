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
        <div className="h-12 w-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center p-1.5 shadow-lg border border-white/20">
          <svg
            width="36"
            height="36"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 10 L20 25 L20 55 C20 75 35 90 50 95 C65 90 80 75 80 55 L80 25 Z"
              fill="#DC2626"
            />
            <path
              d="M35 45 L35 35 L37 35 L37 45 L40 45 L40 35 L42 35 L42 45 L45 45 L45 35 L47 35 L47 45 L50 45 L50 35 L52 35 L52 45 L55 45 L55 40 L57 40 L57 55 C57 60 52 65 45 65 L35 65 C30 65 25 60 25 55 L25 45 C25 42 28 40 32 40 L35 40 Z"
              fill="white"
            />
          </svg>
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