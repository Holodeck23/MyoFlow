import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Button } from '@myoflow/ui'
import { signIn } from 'next-auth/react'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            MyoFlow anmelden
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure practice management for Austrian therapists
          </p>
        </div>
        <div className="space-y-4">
          <Button
            onClick={() => signIn('email')}
            className="w-full"
            variant="outline"
          >
            Mit E-Mail anmelden
          </Button>
          
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <Button
              onClick={() => signIn('google')}
              className="w-full"
            >
              Mit Google anmelden
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}