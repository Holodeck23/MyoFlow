// Core business types for MyoFlow

export interface Invoice {
  id: string
  number: string
  date: Date
  serviceDate: Date
  dueDate: Date
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
  clientId: string
  appointmentId: string | null
  therapistId: string
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Service {
  id: string
  name: string
  duration: number
  defaultPrice: number | null
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Appointment {
  id: string
  start: Date
  end: Date
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
  clientId: string
  serviceId: string
  therapistId: string
  createdAt: Date
  updatedAt: Date
}

export interface TherapistProfile {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  uid: string | null
  iban: string | null
  kleinunternehmer: boolean
  defaultVatRate: number
  createdAt: Date
  updatedAt: Date
}