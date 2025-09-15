'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Calendar', href: '/dashboard/calendar', icon: '📅' },
  { name: 'Inbox', href: '/dashboard/inbox', icon: '📥' },
  { name: 'Clients', href: '/dashboard/clients', icon: '👥' },
  { name: 'Appointments', href: '/dashboard/appointments', icon: '📋' },
  { name: 'Invoices', href: '/dashboard/invoices', icon: '🧾' },
  { name: 'Action Required', href: '/dashboard/actions', icon: '⚠️' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-16 flex-col bg-medical-blue">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center">
        <div className="h-8 w-8 rounded bg-white flex items-center justify-center">
          <span className="text-medical-blue font-bold text-sm">M</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center space-y-1 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex h-12 w-12 items-center justify-center rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-white text-medical-blue'
                  : 'text-white hover:bg-medical-blue-700 hover:text-white'
                }
              `}
              title={item.name}
            >
              <span className="text-lg">{item.icon}</span>
            </Link>
          )
        })}
      </nav>

      {/* Quick Add Button */}
      <div className="pb-4">
        <button className="flex h-12 w-12 items-center justify-center rounded-lg bg-austrian-red text-white hover:bg-austrian-red-700 transition-colors">
          <span className="text-lg">➕</span>
        </button>
      </div>
    </div>
  )
}