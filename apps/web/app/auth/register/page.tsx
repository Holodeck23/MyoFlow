'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, UserPlus, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { validatePassword } from '../../../lib/validation'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Strong password validation using shared validation function
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setMessage(passwordValidation.errors.join('. '))
      setPasswordErrors(passwordValidation.errors)
      setIsLoading(false)
      return
    }

    try {
      const trimmedFirstName = formData.firstName.trim()
      const trimmedLastName = formData.lastName.trim()
      const trimmedEmail = formData.email.trim()
      const payload = {
        email: trimmedEmail,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        practice: formData.practice.trim() || undefined,
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Account created successfully! Redirecting to sign in...')
        setTimeout(() => {
          window.location.href = '/auth/sign-in?message=Account created successfully'
        }, 2000)
      } else {
        setMessage(data.error || 'Registration failed. Please try again.')
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Real-time password validation
    if (name === 'password') {
      const validation = validatePassword(value)
      setPasswordErrors(validation.errors)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-lg w-full bg-white shadow-xl border border-gray-200 rounded-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-end mb-2">
            <LanguageToggle />
          </div>
          <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-austrian-red-500 to-austrian-red-700 flex items-center justify-center shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
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
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 12 chars, upper, lower, number, special char"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</div>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-xs ${formData.password.length >= 12 ? 'text-green-600' : 'text-gray-500'}`}>
                      {formData.password.length >= 12 ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>At least 12 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[A-Z]/.test(formData.password) ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[a-z]/.test(formData.password) ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>One lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[0-9]/.test(formData.password) ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>One number</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>One special character (!@#$%^&* etc.)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordErrors.find(e => e.includes('common patterns')) ? 'text-red-600' : 'text-green-600'}`}>
                      {passwordErrors.find(e => e.includes('common patterns')) ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      <span>No common patterns (password, 123456, etc.)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" variant="required">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
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
