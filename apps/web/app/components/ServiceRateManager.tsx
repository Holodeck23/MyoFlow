'use client'

import { useState, useEffect } from 'react'

interface ServiceRateTemplate {
  id: string
  name: string
  category: string
  priceCents: number
  vatRate: string
  durationMin: number
  description?: string
  isDefault: boolean
}

interface ServiceRateManagerProps {
  therapistVatStatus?: string
}

export default function ServiceRateManager({ therapistVatStatus }: ServiceRateManagerProps) {
  const [templates, setTemplates] = useState<ServiceRateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ServiceRateTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'MASSAGE' as const,
    priceCents: 0,
    vatRate: therapistVatStatus || 'KLEINUNTERNEHMER' as const,
    durationMin: 60,
    description: '',
    isDefault: false
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/service-rate-templates')
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      setTemplates(data.templates)
    } catch (err) {
      setError('Failed to load service rate templates')
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingTemplate 
        ? `/api/service-rate-templates/${editingTemplate.id}`
        : '/api/service-rate-templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      await fetchTemplates()
      setShowForm(false)
      setEditingTemplate(null)
      resetForm()
    } catch (err) {
      setError('Failed to save template')
      console.error('Error saving template:', err)
    }
  }

  const handleEdit = (template: ServiceRateTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category as any,
      priceCents: template.priceCents,
      vatRate: template.vatRate as any,
      durationMin: template.durationMin,
      description: template.description || '',
      isDefault: template.isDefault
    })
    setShowForm(true)
  }

  const handleDelete = async (template: ServiceRateTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/service-rate-templates/${template.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      await fetchTemplates()
    } catch (err) {
      setError('Failed to delete template')
      console.error('Error deleting template:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'MASSAGE',
      priceCents: 0,
      vatRate: therapistVatStatus || 'KLEINUNTERNEHMER',
      durationMin: 60,
      description: '',
      isDefault: false
    })
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100)
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'MASSAGE': return 'Massage'
      case 'YOGA': return 'Yoga'
      case 'CONSULTING': return 'Beratung'
      case 'OTHER': return 'Andere'
      default: return category
    }
  }

  const getVatRateLabel = (vatRate: string) => {
    switch (vatRate) {
      case 'KLEINUNTERNEHMER': return '0% (Kleinunternehmer)'
      case 'UST_10': return '10% (ermäßigt)'
      case 'UST_13': return '13% (ermäßigt)'
      case 'UST_20': return '20% (Normalsteuersatz)'
      default: return vatRate
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading service rates...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Service Rate Templates</h3>
          <p className="text-sm text-gray-500">
            Manage default pricing for different service types
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null)
            resetForm()
            setShowForm(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Add New Template
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingTemplate ? 'Edit Template' : 'Add New Template'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="e.g., Klassische Massage 60min"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="MASSAGE">Massage</option>
                  <option value="YOGA">Yoga</option>
                  <option value="CONSULTING">Beratung</option>
                  <option value="OTHER">Andere</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (EUR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.priceCents / 100}
                  onChange={(e) => setFormData({ ...formData, priceCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="80.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="15"
                  max="480"
                  value={formData.durationMin}
                  onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value || '60') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT Rate *
                </label>
                <select
                  required
                  value={formData.vatRate}
                  onChange={(e) => setFormData({ ...formData, vatRate: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="KLEINUNTERNEHMER">0% (Kleinunternehmer)</option>
                  <option value="UST_10">10% (ermäßigt)</option>
                  <option value="UST_13">13% (ermäßigt)</option>
                  <option value="UST_20">20% (Normalsteuersatz)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  Set as default for this category
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Optional description of the service"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingTemplate(null)
                  resetForm()
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No service rate templates found</p>
          <button
            onClick={() => {
              setEditingTemplate(null)
              resetForm()
              setShowForm(true)
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-md font-medium text-gray-900">{template.name}</h4>
                    {template.isDefault && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-medium">Category:</span> {getCategoryLabel(template.category)}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> {formatPrice(template.priceCents)} 
                      <span className="ml-2 text-xs text-gray-500">({getVatRateLabel(template.vatRate)})</span>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {template.durationMin} minutes
                    </div>
                    {template.description && (
                      <div>
                        <span className="font-medium">Description:</span> {template.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(template)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}