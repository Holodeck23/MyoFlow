'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@myoflow/lib'
import {
  LayoutDashboard,
  Calendar,
  Users2,
  FileText,
  DollarSign,
  Package2,
  BarChart3,
  MessageCircle,
  Globe2,
  Settings,
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
      name: t('sidebar.invoices', 'Invoices & Payments'),
      href: '/dashboard/invoices',
      icon: DollarSign,
      available: true,
      badge: 3
    },
    {
      name: t('sidebar.sessions', 'Sessions & Notes'),
      href: '/dashboard/sessions',
      icon: FileText,
      available: false
    },
    {
      name: t('sidebar.products', 'Products & Packages'),
      href: '/dashboard/products',
      icon: Package2,
      available: false
    },
    {
      name: t('sidebar.reports', 'Reports'),
      href: '/dashboard/reports',
      icon: BarChart3,
      available: false
    },
    {
      name: t('sidebar.messaging', 'Messaging'),
      href: '/dashboard/messaging',
      icon: MessageCircle,
      available: false
    },
    {
      name: t('sidebar.booking', 'Booking Page'),
      href: '/dashboard/booking',
      icon: Globe2,
      available: false
    },
  ]

  return (
    <div className={`flex min-h-screen ${isCollapsed ? 'w-16' : 'w-64'} flex-col bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0`}>
      {/* Professional Branding Header */}
      <div className={`flex h-20 shrink-0 items-center border-b border-gray-100 ${isCollapsed ? 'px-3 justify-center' : 'px-6'}`}>
        <div className="flex items-center justify-between w-full">
          {!isCollapsed && (
            <div className="flex items-center">
              <Image
                src="/shield-logo.png"
                alt="MyoFlow"
                width={180}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-center">
              <Image
                src="/shield-logo.png"
                alt="MyoFlow"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-6 right-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Professional Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
          const IconComponent = item.icon
          const isAvailable = item.available
          const baseClasses = `group flex items-center ${isCollapsed ? 'px-2 justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-colors duration-200`
          const stateClasses = isAvailable
            ? isActive
              ? 'bg-[#1565C0] text-white'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-400 cursor-not-allowed'

          const content = (
            <>
              <IconComponent size={20} className={`flex-shrink-0 ${!isCollapsed && 'mr-3'}`} />
              {!isCollapsed && (
                <span className="flex-1 min-w-0 overflow-hidden">
                  <span className="block truncate text-ellipsis whitespace-nowrap">
                    {item.name}
                  </span>
                </span>
              )}

              {item.badge && isAvailable && !isCollapsed && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </>
          )

          return (
            <div key={item.name} className="relative">
              {isAvailable ? (
                <Link
                  href={item.href}
                  className={`${baseClasses} ${stateClasses}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  className={`${baseClasses} ${stateClasses}`}
                  title={isCollapsed ? item.name : undefined}
                  aria-disabled
                >
                  {content}
                </button>
              )}
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
          <span className="flex-1 min-w-0 truncate">{t('sidebar.settings', 'Settings')}</span>
        </Link>
      </div>
    </div>
  )
}
