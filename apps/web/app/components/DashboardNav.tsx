'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Logo } from '@/components/ui/Logo'

interface DashboardNavProps {
  active: 'dashboard' | 'clients' | 'appointments' | 'invoices' | 'settings'
  children?: React.ReactNode
}

export function DashboardNav({ active, children }: DashboardNavProps) {
  const { data: session } = useSession()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/dashboard/clients', label: 'Klienten', key: 'clients' },
    { href: '/dashboard/appointments', label: 'Termine', key: 'appointments' },
    { href: '/dashboard/invoices', label: 'Rechnungen', key: 'invoices' },
    { href: '/dashboard/settings', label: 'Einstellungen', key: 'settings' },
  ] as const

  return (
    <nav className="bg-white shadow-professional border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="hover:opacity-80 transition-professional">
              <Logo size="sm" />
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex space-x-6">
              {navItems.map((item) => (
                item.key === active ? (
                  <span
                    key={item.key}
                    className="text-medical-blue font-semibold text-sm"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="text-neutral-gray-600 hover:text-medical-blue font-medium text-sm transition-professional"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-neutral-gray-600">
              <div className="w-8 h-8 bg-medical-blue-100 rounded-full flex items-center justify-center">
                <span className="text-medical-blue font-semibold text-xs">
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:block">{session?.user?.email}</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </nav>
  )
}

