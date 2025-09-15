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
  Plus
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const navigation = [
    { name: t('sidebar.dashboard', 'Dashboard'), href: '/dashboard', icon: Home, bgColor: 'bg-blue-500' },
    { name: t('sidebar.clients', 'Klienten'), href: '/dashboard/clients', icon: Users, bgColor: 'bg-indigo-500' },
    { name: t('sidebar.appointments', 'Termine'), href: '/dashboard/appointments', icon: Calendar, bgColor: 'bg-green-500' },
    { name: t('sidebar.invoices', 'Rechnungen'), href: '/dashboard/invoices', icon: FileText, bgColor: 'bg-purple-500' },
    { name: t('sidebar.settings', 'Einstellungen'), href: '/dashboard/settings', icon: Settings, bgColor: 'bg-gray-500' },
  ]

  return (
    <div className="flex h-screen w-16 flex-col bg-medical-blue">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center">
        <div className="h-8 w-8 rounded bg-white flex items-center justify-center">
          <span className="text-medical-blue font-bold text-sm">M</span>
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
                group flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-200 shadow-lg
                ${isActive
                  ? 'bg-white text-medical-blue scale-110 shadow-xl'
                  : `${item.bgColor} text-white hover:scale-105 hover:shadow-xl`
                }
              `}
              title={item.name}
            >
              <IconComponent size={24} />
            </Link>
          )
        })}
      </nav>

      {/* Quick Add Button */}
      <div className="pb-6">
        <button className="flex h-14 w-14 items-center justify-center rounded-xl bg-austrian-red text-white hover:bg-austrian-red-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}