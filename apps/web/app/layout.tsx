'use client'

import { SessionProvider } from 'next-auth/react'
import { Inter } from 'next/font/google'
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
    <html lang="de" className={inter.variable}>
      <head>
        <title>MyoFlow - Praxisverwaltung für Therapeuten</title>
        <meta name="description" content="Professionelle Praxisverwaltungssoftware für österreichische Therapeuten" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
      </head>
      <body className={`${inter.className} antialiased bg-background text-neutral-gray-700`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
