'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@myoflow/lib'
import {
  LayoutDashboard,
  Calendar,
  Users2,
  ClipboardList,
  FileText,
  DollarSign,
  Package2,
  BarChart3,
  MessageCircle,
  Globe2,
  Settings,
  Bug,
  Menu,
  ChevronLeft
} from 'lucide-react'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
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
      name: t('sidebar.calendar', 'Calendar & Appointments'),
      href: '/dashboard/calendar',
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
      icon: FileText,
      available: false,
      comingSoon: 'v1.7'
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
    {
      name: t('sidebar.settings', 'Settings'),
      href: '/dashboard/settings',
      icon: Settings,
      available: true
    },
  ]

  return (
    <div className={`flex min-h-screen ${isCollapsed ? 'w-16' : 'w-64'} flex-col bg-white border-r border-gray-200 transition-all duration-300`}>
      {/* Professional Branding Header */}
      <div className={`flex h-20 shrink-0 items-center border-b border-gray-100 ${isCollapsed ? 'px-3' : 'px-6'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-medical-blue flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-semibold text-gray-900">MyoFlow Therapy</h1>
                <p className="text-sm text-gray-500">Physiotherapie Praxis</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
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
                  group flex items-center ${isCollapsed ? 'px-2 justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors duration-200
                  ${isActive && isAvailable
                    ? 'bg-[#1565C0] text-white'
                    : isAvailable
                    ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
                  }
                `}
                onClick={!isAvailable ? (e) => e.preventDefault() : undefined}
                title={isCollapsed ? item.name : undefined}
              >
                <IconComponent size={20} className={`flex-shrink-0 ${!isCollapsed && 'mr-3'}`} />
                {!isCollapsed && <span className="flex-1">{item.name}</span>}

                {/* Notification Badge */}
                {item.badge && !isCollapsed && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}

                {/* Coming Soon Badge */}
                {!isAvailable && item.comingSoon && !isCollapsed && (
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