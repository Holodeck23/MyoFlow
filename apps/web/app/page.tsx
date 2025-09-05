'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-16 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MyoFlow
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Austrian Practice Management for Massage Therapists
          </p>
          
          {session ? (
            <div className="space-y-4">
              <p className="text-green-600">
                Welcome back, {session.user?.email}!
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Secure, compliant, and designed specifically for Austrian massage therapy practices.
              </p>
              <Link
                href="/auth/sign-in"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">✅ Austrian Compliant</h3>
              <p className="text-gray-600">Built for Austrian tax laws, Kleinunternehmer regulation, and therapist designations.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">🔒 Secure & Private</h3>
              <p className="text-gray-600">Field-level encryption for health data with comprehensive audit logging.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">📱 Complete Solution</h3>
              <p className="text-gray-600">Client management, scheduling, invoicing, and public booking pages.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}