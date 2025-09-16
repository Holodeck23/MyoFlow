'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@myoflow/lib'
import {
  LayoutDashboard,
  Calendar,
  Users2,
  ClipboardList,
  DollarSign,
  Package2,
  BarChart3,
  MessageCircle,
  Globe2,
  Settings,
  Bug
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const navigation = [
    {
      name: t('sidebar.dashboard', 'Dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      available: true
    },
    {
      name: t('sidebar.calendar', 'Calendar'),
      href: '/dashboard/appointments',
      icon: Calendar,
      available: true
    },
    {
      name: t('sidebar.clients', 'Clients'),
      href: '/dashboard/clients',
      icon: Users2,
      available: true
    },
    {
      name: t('sidebar.sessions', 'Sessions & Notes'),
      href: '/dashboard/sessions',
      icon: ClipboardList,
      available: true
    },
    {
      name: t('sidebar.invoices', 'Invoices & Payments'),
      href: '/dashboard/invoices',
      icon: DollarSign,
      available: true,
      badge: 3
    },
    {
      name: t('sidebar.products', 'Products & Packages'),
      href: '/dashboard/products',
      icon: Package2,
      available: false,
      comingSoon: 'v1.8'
    },
    {
      name: t('sidebar.reports', 'Reports'),
      href: '/dashboard/reports',
      icon: BarChart3,
      available: false,
      comingSoon: 'v1.7'
    },
    {
      name: t('sidebar.messaging', 'Messaging'),
      href: '/dashboard/messaging',
      icon: MessageCircle,
      available: false,
      comingSoon: 'v1.8',
      badge: 2
    },
    {
      name: t('sidebar.booking', 'Booking Page'),
      href: '/dashboard/booking',
      icon: Globe2,
      available: false,
      comingSoon: 'v1.9'
    },
  ]

  return (
    <div className="flex min-h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Professional Branding Header */}
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-medical-blue flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">MyoFlow Therapy</h1>
            <p className="text-sm text-gray-500">Physiotherapie Praxis</p>
          </div>
        </div>
      </div>

      {/* Professional Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
          const IconComponent = item.icon
          const isAvailable = item.available

          return (
            <div key={item.name} className="relative">
              <Link
                href={isAvailable ? item.href : '#'}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200
                  ${isActive && isAvailable
                    ? 'bg-medical-blue text-white'
                    : isAvailable
                    ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
                  }
                `}
                onClick={!isAvailable ? (e) => e.preventDefault() : undefined}
              >
                <IconComponent size={20} className="mr-3 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>

                {/* Notification Badge */}
                {item.badge && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}

                {/* Coming Soon Badge */}
                {!isAvailable && item.comingSoon && (
                  <span className="ml-2 bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">
                    {item.comingSoon}
                  </span>
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Settings Section */}
      <div className="border-t border-gray-200 p-4">
        <Link
          href="/dashboard/settings"
          className={`
            group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200
            ${pathname.startsWith('/dashboard/settings')
              ? 'bg-medical-blue text-white'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
          `}
        >
          <Settings size={20} className="mr-3 flex-shrink-0" />
          <span className="flex-1">Settings</span>
        </Link>
      </div>
    </div>
  )
}