'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ClientFormField = 'name' | 'email' | 'phone' | 'street' | 'postalCode' | 'city' | 'country'

type ClientFormData = {
  name: string
  email: string
  phone: string
  street: string
  postalCode: string
  city: string
  country: string
  tags: string[]
}

const initialFormData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  street: '',
  postalCode: '',
  city: '',
  country: '',
  tags: []
}

export default function NewClientPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClientFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Partial<Record<ClientFormField, string>>>({})
  
  const [tagInput, setTagInput] = useState('')

  const updateFormField = (field: ClientFormField, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))

    setFormErrors((prev) => {
      if (!prev[field]) return prev
      const { [field]: _removed, ...rest } = prev
      return rest
    })
  }

  const validateForm = (data: ClientFormData) => {
    const nextErrors: Partial<Record<ClientFormField, string>> = {}
    const requiredFields: ClientFormField[] = ['name', 'street', 'postalCode', 'city', 'country']

    requiredFields.forEach((field) => {
      if (!data[field].trim()) {
        nextErrors[field] = 'This field is required.'
      }
    })

    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    return nextErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedData: ClientFormData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      street: formData.street.trim(),
      postalCode: formData.postalCode.trim(),
      city: formData.city.trim(),
      country: formData.country.trim(),
      tags: formData.tags
    }

    const validationErrors = validateForm(trimmedData)
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors)
      return
    }

    setLoading(true)
    setFormErrors({})

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...trimmedData,
          email: trimmedData.email || undefined,
          phone: trimmedData.phone || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData?.details && Array.isArray(errorData.details)) {
          const apiErrors: Partial<Record<ClientFormField, string>> = {}
          for (const detail of errorData.details) {
            const field = detail?.path?.[0]
            if (typeof field === 'string' && (['name', 'email', 'phone', 'street', 'postalCode', 'city', 'country'] as ClientFormField[]).includes(field as ClientFormField)) {
              apiErrors[field as ClientFormField] = detail.message
            }
          }
          if (Object.keys(apiErrors).length > 0) {
            setFormErrors(apiErrors)
          }
        }
        throw new Error(errorData.error || 'Failed to create client')
      }

      const client = await response.json()
      router.push(`/dashboard/clients/${client.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag && !formData.tags.includes(tag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag]
        }))
        setTagInput('')
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/sign-in')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-semibold text-blue-600 hover:text-blue-700">
                MyoFlow
              </Link>
              <Link href="/dashboard/clients" className="text-sm text-gray-500 hover:text-gray-700">
                Clients
              </Link>
              <span className="text-sm text-gray-500">New Client</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session?.user?.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-lg font-medium text-gray-900">Add New Client</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a new client profile for your practice.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  aria-invalid={Boolean(formErrors.name)}
                  aria-describedby={formErrors.name ? 'name-error' : undefined}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Enter client's full name"
                />
                {formErrors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => updateFormField('email', e.target.value)}
                  aria-invalid={Boolean(formErrors.email)}
                  aria-describedby={formErrors.email ? 'email-error' : undefined}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="client@example.com"
                />
                {formErrors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormField('phone', e.target.value)}
                  aria-invalid={Boolean(formErrors.phone)}
                  aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formErrors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="+43 1 234 5678"
                />
                {formErrors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-red-600">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Street Address *
                </label>
                <input
                  type="text"
                  id="street"
                  required
                  value={formData.street}
                  onChange={(e) => updateFormField('street', e.target.value)}
                  aria-invalid={Boolean(formErrors.street)}
                  aria-describedby={formErrors.street ? 'street-error' : undefined}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formErrors.street ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Mariahilfer Straße 1"
                />
                {formErrors.street && (
                  <p id="street-error" className="mt-1 text-sm text-red-600">
                    {formErrors.street}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={(e) => updateFormField('postalCode', e.target.value)}
                  aria-invalid={Boolean(formErrors.postalCode)}
                  aria-describedby={formErrors.postalCode ? 'postalCode-error' : undefined}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formErrors.postalCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="1070"
                />
                {formErrors.postalCode && (
                  <p id="postalCode-error" className="mt-1 text-sm text-red-600">
                    {formErrors.postalCode}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => updateFormField('city', e.target.value)}
                  aria-invalid={Boolean(formErrors.city)}
                  aria-describedby={formErrors.city ? 'city-error' : undefined}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formErrors.city ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Vienna"
                />
                {formErrors.city && (
                  <p id="city-error" className="mt-1 text-sm text-red-600">
                    {formErrors.city}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => updateFormField('country', e.target.value)}
                  aria-invalid={Boolean(formErrors.country)}
                  aria-describedby={formErrors.country ? 'country-error' : undefined}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${formErrors.country ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Austria"
                />
                {formErrors.country && (
                  <p id="country-error" className="mt-1 text-sm text-red-600">
                    {formErrors.country}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add tags (press Enter or comma to add)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use tags to categorize clients (e.g., &quot;VIP&quot;, &quot;Regular&quot;, &quot;New&quot;)
                </p>
                
                {formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <Link
                href="/dashboard/clients"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={
                  loading ||
                  !formData.name.trim() ||
                  !formData.street.trim() ||
                  !formData.postalCode.trim() ||
                  !formData.city.trim() ||
                  !formData.country.trim()
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium"
              >
                {loading ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
