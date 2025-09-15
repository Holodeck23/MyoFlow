'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    practice: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    // Placeholder - would connect to actual registration API
    setTimeout(() => {
      setMessage('Registration feature coming soon! Contact support@myoflow.at for early access.')
      setIsLoading(false)
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-austrian-red-600 via-medical-blue-600 to-medical-blue-800 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <Card className="max-w-lg w-full bg-white/95 backdrop-blur-sm shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-austrian-red-500 to-austrian-red-700 flex items-center justify-center shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-austrian-red-600 to-medical-blue-600 bg-clip-text text-transparent">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Join Austrian therapists managing their practice with MyoFlow
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" variant="required">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Vorname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" variant="required">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nachname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="practice">
                Practice Name
              </Label>
              <Input
                id="practice"
                name="practice"
                type="text"
                value={formData.practice}
                onChange={handleChange}
                placeholder="Praxis Name (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" variant="required">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ihre.email@beispiel.at"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" variant="required">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Secure password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" variant="required">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-austrian-red-600 to-medical-blue-600 hover:from-austrian-red-700 hover:to-medical-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {message && (
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

            <div className="text-center text-xs text-gray-500 mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}