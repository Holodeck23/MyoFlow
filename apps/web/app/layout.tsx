'use client'

import { SessionProvider } from 'next-auth/react'
import { Inter } from 'next/font/google'
import { LocaleProvider } from '@myoflow/lib'
import { RootContent } from '@/app/components/RootContent'
import './globals.css'

// Load Inter font for MyoFlow branding
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de-AT" className={inter.variable}>
      <head>
        <title>MyoFlow - Praxisverwaltung für Therapeuten</title>
        <meta name="description" content="Professionelle Praxisverwaltungssoftware für österreichische Therapeuten" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} antialiased bg-background text-neutral-gray-700`}>
        <SessionProvider>
          <LocaleProvider>
            <RootContent>
              {children}
            </RootContent>
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
