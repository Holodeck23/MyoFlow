'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    // Placeholder - would connect to actual password reset API
    setTimeout(() => {
      setIsSuccess(true)
      setMessage(`Password reset instructions sent to ${email}. Please check your inbox.`)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-blue-800 via-medical-blue-600 to-medical-blue-400 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <Card className="max-w-md w-full bg-white/95 backdrop-blur-sm shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-medical-blue-500 to-medical-blue-700 flex items-center justify-center shadow-lg">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-medical-blue-600 to-medical-blue-800 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Enter your email to receive reset instructions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isSuccess ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" variant="required">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
                <p className="text-xs text-gray-500">
                  We'll send password reset instructions to this email
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-medical-blue-600 to-medical-blue-700 hover:from-medical-blue-700 hover:to-medical-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
                <p className="text-sm text-gray-600">
                  Password reset instructions have been sent to your email address.
                </p>
              </div>
            </div>
          )}

          {message && !isSuccess && (
            <div className="text-sm text-center p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              {message}
            </div>
          )}

          {/* Back to Sign In */}
          <div className="border-t border-gray-100 pt-6">
            <Link
              href="/auth/sign-in"
              className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 font-medium hover:underline"
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>

            {isSuccess && (
              <div className="text-center text-xs text-gray-500 mt-4">
                Didn't receive the email? Check your spam folder or contact support@myoflow.at
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}