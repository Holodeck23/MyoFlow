# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-10-05-invoice-safety-customization/spec.md

> Created: 2025-10-05
> Status: Ready for Implementation

## Tasks

### Task 1: Database Schema & Migration
**Priority:** HIGH | **Estimated Time:** 2 hours | **Dependencies:** None

#### 1.1 Create Prisma Schema Changes
- [ ] Add `invoiceLogoUrl String?` to Therapist model
- [ ] Add `invoiceDisplayPreference InvoiceDisplayPreference @default(NAME)` to Therapist model
- [ ] Add `invoiceThankYouMessage String?` to Therapist model
- [ ] Add `taxValidationStatus Boolean @default(false)` to Therapist model
- [ ] Add `taxValidatedAt DateTime?` to Therapist model
- [ ] Add `taxValidatedBy String?` to Therapist model
- [ ] Create `InvoiceDisplayPreference` enum with values: LOGO, NAME, BOTH
- [ ] Run `pnpm db:migrate` to generate migration file
- [ ] Verify migration with `pnpm db:push`

**Test:**
```typescript
// packages/db/__tests__/schema.test.ts
describe('Invoice Customization Schema', () => {
  it('should allow null invoiceLogoUrl', async () => {
    const therapist = await prisma.therapist.create({
      data: { /* ... */ invoiceLogoUrl: null }
    })
    expect(therapist.invoiceLogoUrl).toBeNull()
  })

  it('should default invoiceDisplayPreference to NAME', async () => {
    const therapist = await prisma.therapist.create({
      data: { /* ... */ }
    })
    expect(therapist.invoiceDisplayPreference).toBe('NAME')
  })

  it('should default taxValidationStatus to false', async () => {
    const therapist = await prisma.therapist.create({
      data: { /* ... */ }
    })
    expect(therapist.taxValidationStatus).toBe(false)
  })
})
```

---

### Task 2: TypeScript Type Definitions
**Priority:** HIGH | **Estimated Time:** 1 hour | **Dependencies:** Task 1

#### 2.1 Create Compliance Type Definitions
- [ ] Create `apps/web/types/compliance.ts`
- [ ] Define `RevenueStatus` interface
- [ ] Define `ComplianceChecklist` interface
- [ ] Define `InvoiceValidation` interface
- [ ] Define `InvoiceBrandingSettings` interface
- [ ] Export all types

**Implementation:**
```typescript
// apps/web/types/compliance.ts
export interface RevenueStatus {
  currentYearRevenue: number
  currentYearRevenueCents: number
  thresholdPercentage: number
  threshold: number
  thresholdCents: number
  isApproaching: boolean // true when >70%
  isCritical: boolean    // true when >90%
  year: number
  lastCalculatedAt: Date
}

export interface ComplianceChecklist {
  taxValidated: boolean
  taxValidatedAt: Date | null
  taxValidatedBy: string | null
  invoiceBrandingConfigured: boolean
  vatRatesReviewed: boolean
  revenueMonitoringActive: boolean
  taxAdvisorConfigured: boolean
  readinessScore: number // 0-100
  warnings: string[]
  errors: string[]
}

export interface InvoiceValidation {
  canGenerate: boolean
  warnings: string[]
  errors: string[]
  readinessScore: number // 0-100
  checks: {
    hasClientAddress: boolean
    hasValidIBAN: boolean
    hasValidVATRate: boolean
    hasTaxValidation: boolean
    hasRequiredBranding: boolean
  }
}

export interface InvoiceBrandingSettings {
  logoUrl: string | null
  displayPreference: 'LOGO' | 'NAME' | 'BOTH'
  thankYouMessage: string | null
  brandColor: string | null
}

export interface VATRateWarning {
  show: boolean
  severity: 'warning' | 'error'
  message: string
  recommendation: string
}
```

**Test:**
```typescript
// apps/web/types/__tests__/compliance.test.ts
import type { RevenueStatus, ComplianceChecklist } from '../compliance'

describe('Compliance Types', () => {
  it('should satisfy RevenueStatus interface', () => {
    const status: RevenueStatus = {
      currentYearRevenue: 45000,
      currentYearRevenueCents: 4500000,
      thresholdPercentage: 81.82,
      threshold: 55000,
      thresholdCents: 5500000,
      isApproaching: true,
      isCritical: false,
      year: 2025,
      lastCalculatedAt: new Date()
    }
    expect(status.isApproaching).toBe(true)
  })
})
```

---

### Task 3: Revenue Calculation Logic
**Priority:** HIGH | **Estimated Time:** 3 hours | **Dependencies:** Task 1, Task 2

#### 3.1 Create Revenue Calculation Service
- [ ] Create `packages/lib/src/revenue-calculator.ts`
- [ ] Implement `calculateCurrentYearRevenue(therapistId)` function
- [ ] Implement caching logic using `annualGrossCents` and `annualGrossCachedAt`
- [ ] Add 24-hour cache TTL
- [ ] Handle edge cases (no invoices, partial year)

**Implementation:**
```typescript
// packages/lib/src/revenue-calculator.ts
import { PrismaClient } from '@myoflow/db'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const KLEINUNTERNEHMER_THRESHOLD_CENTS = 5500000 // €55,000

export interface RevenueCalculationResult {
  currentYearRevenueCents: number
  currentYearRevenue: number
  thresholdPercentage: number
  threshold: number
  thresholdCents: number
  isApproaching: boolean // >70%
  isCritical: boolean    // >90%
  year: number
  lastCalculatedAt: Date
  fromCache: boolean
}

export async function calculateCurrentYearRevenue(
  prisma: PrismaClient,
  therapistId: string,
  forceRefresh = false
): Promise<RevenueCalculationResult> {
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId }
  })

  if (!therapist) {
    throw new Error('Therapist not found')
  }

  const now = new Date()
  const currentYear = now.getFullYear()

  // Check cache validity
  const cacheValid = therapist.annualGrossCachedAt &&
    (now.getTime() - therapist.annualGrossCachedAt.getTime()) < CACHE_TTL_MS &&
    !forceRefresh

  let revenueCents: number

  if (cacheValid) {
    revenueCents = therapist.annualGrossCents
  } else {
    // Calculate from invoices
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear + 1, 0, 1)

    const invoices = await prisma.invoice.findMany({
      where: {
        therapistId,
        status: { in: ['SENT', 'PAID'] },
        createdAt: {
          gte: yearStart,
          lt: yearEnd
        }
      },
      select: { totalGrossCents: true }
    })

    revenueCents = invoices.reduce((sum, inv) => sum + inv.totalGrossCents, 0)

    // Update cache
    await prisma.therapist.update({
      where: { id: therapistId },
      data: {
        annualGrossCents: revenueCents,
        annualGrossCachedAt: now
      }
    })
  }

  const thresholdPercentage = (revenueCents / KLEINUNTERNEHMER_THRESHOLD_CENTS) * 100

  return {
    currentYearRevenueCents: revenueCents,
    currentYearRevenue: revenueCents / 100,
    thresholdPercentage: Math.round(thresholdPercentage * 100) / 100,
    threshold: 55000,
    thresholdCents: KLEINUNTERNEHMER_THRESHOLD_CENTS,
    isApproaching: thresholdPercentage >= 70,
    isCritical: thresholdPercentage >= 90,
    year: currentYear,
    lastCalculatedAt: therapist.annualGrossCachedAt || now,
    fromCache: cacheValid || false
  }
}
```

**Test:**
```typescript
// packages/lib/__tests__/revenue-calculator.test.ts
import { calculateCurrentYearRevenue } from '../src/revenue-calculator'
import { PrismaClient } from '@myoflow/db'

const prisma = new PrismaClient()

describe('Revenue Calculator', () => {
  it('should calculate revenue from invoices', async () => {
    const result = await calculateCurrentYearRevenue(prisma, 'therapist-id')
    expect(result.currentYearRevenue).toBeGreaterThanOrEqual(0)
    expect(result.thresholdPercentage).toBeGreaterThanOrEqual(0)
  })

  it('should use cached value when cache is valid', async () => {
    const result1 = await calculateCurrentYearRevenue(prisma, 'therapist-id')
    expect(result1.fromCache).toBe(false)

    const result2 = await calculateCurrentYearRevenue(prisma, 'therapist-id')
    expect(result2.fromCache).toBe(true)
  })

  it('should mark as approaching when >70%', async () => {
    // Mock therapist with €40,000 revenue
    const result = await calculateCurrentYearRevenue(prisma, 'therapist-id')
    if (result.thresholdPercentage >= 70) {
      expect(result.isApproaching).toBe(true)
    }
  })

  it('should mark as critical when >90%', async () => {
    // Mock therapist with €50,000 revenue
    const result = await calculateCurrentYearRevenue(prisma, 'therapist-id')
    if (result.thresholdPercentage >= 90) {
      expect(result.isCritical).toBe(true)
    }
  })
})
```

---

### Task 4: API Route - Revenue Status
**Priority:** HIGH | **Estimated Time:** 2 hours | **Dependencies:** Task 3

#### 4.1 Create Revenue Status API Endpoint
- [ ] Create `apps/web/app/api/compliance/revenue-status/route.ts`
- [ ] Implement GET handler using `calculateCurrentYearRevenue`
- [ ] Add authentication check
- [ ] Add error handling

**Implementation:**
```typescript
// apps/web/app/api/compliance/revenue-status/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireTherapist } from '@/lib/require-therapist'
import { calculateCurrentYearRevenue } from '@myoflow/lib/revenue-calculator'
import { prisma } from '@myoflow/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapist = await requireTherapist(session.user.id)

    const revenueStatus = await calculateCurrentYearRevenue(
      prisma,
      therapist.id
    )

    return NextResponse.json(revenueStatus)
  } catch (error) {
    console.error('Revenue status error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate revenue status' },
      { status: 500 }
    )
  }
}
```

**Test:**
```typescript
// apps/web/app/api/compliance/revenue-status/__tests__/route.test.ts
import { GET } from '../route'
import { auth } from '@/lib/auth'

jest.mock('@/lib/auth')
jest.mock('@/lib/require-therapist')

describe('GET /api/compliance/revenue-status', () => {
  it('should return 401 when not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('should return revenue status for authenticated therapist', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-id' } })
    const response = await GET()
    const data = await response.json()

    expect(data).toHaveProperty('currentYearRevenue')
    expect(data).toHaveProperty('thresholdPercentage')
    expect(data).toHaveProperty('isApproaching')
  })
})
```

---

### Task 5: API Route - Invoice Branding
**Priority:** MEDIUM | **Estimated Time:** 3 hours | **Dependencies:** Task 1, Task 2

#### 5.1 Create Invoice Branding API Endpoint
- [ ] Create `apps/web/app/api/settings/invoice-branding/route.ts`
- [ ] Implement PUT handler for updating branding settings
- [ ] Add validation for display preference enum
- [ ] Add validation for thank you message length (max 500 chars)
- [ ] Add authentication check

**Implementation:**
```typescript
// apps/web/app/api/settings/invoice-branding/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireTherapist } from '@/lib/require-therapist'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

const InvoiceBrandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  displayPreference: z.enum(['LOGO', 'NAME', 'BOTH']).optional(),
  thankYouMessage: z.string().max(500).nullable().optional()
})

export const dynamic = 'force-dynamic'

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapist = await requireTherapist(session.user.id)
    const body = await request.json()

    const validatedData = InvoiceBrandingSchema.parse(body)

    const updated = await prisma.therapist.update({
      where: { id: therapist.id },
      data: {
        invoiceLogoUrl: validatedData.logoUrl,
        invoiceDisplayPreference: validatedData.displayPreference,
        invoiceThankYouMessage: validatedData.thankYouMessage
      },
      select: {
        invoiceLogoUrl: true,
        invoiceDisplayPreference: true,
        invoiceThankYouMessage: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Invoice branding update error:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice branding' },
      { status: 500 }
    )
  }
}
```

**Test:**
```typescript
// apps/web/app/api/settings/invoice-branding/__tests__/route.test.ts
import { PUT } from '../route'
import { auth } from '@/lib/auth'

describe('PUT /api/settings/invoice-branding', () => {
  it('should update logo URL', async () => {
    const request = new Request('http://localhost/api/settings/invoice-branding', {
      method: 'PUT',
      body: JSON.stringify({
        logoUrl: 'https://example.com/logo.png',
        displayPreference: 'LOGO'
      })
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(data.invoiceLogoUrl).toBe('https://example.com/logo.png')
    expect(data.invoiceDisplayPreference).toBe('LOGO')
  })

  it('should reject invalid display preference', async () => {
    const request = new Request('http://localhost/api/settings/invoice-branding', {
      method: 'PUT',
      body: JSON.stringify({
        displayPreference: 'INVALID'
      })
    })

    const response = await PUT(request)
    expect(response.status).toBe(400)
  })

  it('should reject thank you message >500 chars', async () => {
    const request = new Request('http://localhost/api/settings/invoice-branding', {
      method: 'PUT',
      body: JSON.stringify({
        thankYouMessage: 'x'.repeat(501)
      })
    })

    const response = await PUT(request)
    expect(response.status).toBe(400)
  })
})
```

---

### Task 6: API Route - Compliance Checklist
**Priority:** MEDIUM | **Estimated Time:** 2 hours | **Dependencies:** Task 1, Task 2, Task 3

#### 6.1 Create Compliance Checklist API Endpoint
- [ ] Create `apps/web/app/api/compliance/checklist/route.ts`
- [ ] Implement GET handler returning compliance status
- [ ] Calculate readiness score (0-100)
- [ ] Check all validation criteria

**Implementation:**
```typescript
// apps/web/app/api/compliance/checklist/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireTherapist } from '@/lib/require-therapist'
import { prisma } from '@myoflow/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapist = await requireTherapist(session.user.id)

    // Fetch related data
    const [services, taxSettings] = await Promise.all([
      prisma.service.findMany({
        where: { therapistId: therapist.id },
        select: { vatRate: true }
      }),
      prisma.taxComplianceSettings.findUnique({
        where: { therapistId: therapist.id }
      })
    ])

    // Check compliance criteria
    const taxValidated = therapist.taxValidationStatus
    const invoiceBrandingConfigured = !!(
      therapist.invoiceLogoUrl || therapist.invoiceThankYouMessage
    )
    const vatRatesReviewed = services.length > 0 // Simplified - could add review flag
    const revenueMonitoringActive = therapist.annualGrossCachedAt !== null
    const taxAdvisorConfigured = !!(
      therapist.taxAdvisorName && therapist.taxAdvisorEmail
    )

    // Calculate readiness score
    const criteria = [
      taxValidated,
      invoiceBrandingConfigured,
      vatRatesReviewed,
      revenueMonitoringActive,
      taxAdvisorConfigured
    ]
    const readinessScore = (criteria.filter(Boolean).length / criteria.length) * 100

    // Generate warnings
    const warnings: string[] = []
    if (!taxValidated) warnings.push('Invoice settings not professionally validated')
    if (!taxAdvisorConfigured) warnings.push('Tax advisor contact information missing')
    if (!revenueMonitoringActive) warnings.push('Revenue monitoring not initialized')

    return NextResponse.json({
      taxValidated,
      taxValidatedAt: therapist.taxValidatedAt,
      taxValidatedBy: therapist.taxValidatedBy,
      invoiceBrandingConfigured,
      vatRatesReviewed,
      revenueMonitoringActive,
      taxAdvisorConfigured,
      readinessScore: Math.round(readinessScore),
      warnings,
      errors: []
    })
  } catch (error) {
    console.error('Compliance checklist error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance checklist' },
      { status: 500 }
    )
  }
}
```

**Test:**
```typescript
// apps/web/app/api/compliance/checklist/__tests__/route.test.ts
describe('GET /api/compliance/checklist', () => {
  it('should calculate readiness score correctly', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.readinessScore).toBeGreaterThanOrEqual(0)
    expect(data.readinessScore).toBeLessThanOrEqual(100)
  })

  it('should include warnings for missing items', async () => {
    const response = await GET()
    const data = await response.json()

    expect(Array.isArray(data.warnings)).toBe(true)
  })
})
```

---

### Task 7: UI Component - Revenue Threshold Widget
**Priority:** HIGH | **Estimated Time:** 3 hours | **Dependencies:** Task 4

#### 7.1 Create Revenue Threshold Dashboard Widget
- [ ] Create `apps/web/components/dashboard/revenue-threshold-widget.tsx`
- [ ] Implement progress bar with color coding
- [ ] Add responsive design
- [ ] Fetch data from `/api/compliance/revenue-status`
- [ ] Add loading and error states

**Implementation:**
```typescript
// apps/web/components/dashboard/revenue-threshold-widget.tsx
'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import type { RevenueStatus } from '@/types/compliance'

export function RevenueThresholdWidget() {
  const [status, setStatus] = useState<RevenueStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/compliance/revenue-status')
      .then(res => res.json())
      .then(data => {
        setStatus(data)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load revenue data')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
  }

  if (error || !status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error || 'Failed to load'}</p>
      </div>
    )
  }

  const getColorClass = () => {
    if (status.isCritical) return 'bg-red-500'
    if (status.isApproaching) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getIcon = () => {
    if (status.isCritical) return <AlertTriangle className="w-6 h-6 text-red-600" />
    if (status.isApproaching) return <AlertTriangle className="w-6 h-6 text-yellow-600" />
    return <CheckCircle className="w-6 h-6 text-green-600" />
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Kleinunternehmer Threshold
        </h3>
        {getIcon()}
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-2xl font-bold text-gray-900">
            €{status.currentYearRevenue.toLocaleString('de-AT', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-gray-600">
            of €{status.threshold.toLocaleString('de-AT')}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getColorClass()}`}
            style={{ width: `${Math.min(status.thresholdPercentage, 100)}%` }}
          />
        </div>

        <p className="text-sm text-gray-600 mt-2">
          {status.thresholdPercentage.toFixed(1)}% of annual threshold ({status.year})
        </p>
      </div>

      {status.isApproaching && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> You're approaching the €55,000 threshold.
            Consider consulting your tax advisor about VAT registration.
          </p>
        </div>
      )}

      {status.isCritical && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-red-800">
            <strong>Critical:</strong> You're close to exceeding the Kleinunternehmer limit.
            Contact your tax advisor immediately to discuss VAT registration.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Last updated: {new Date(status.lastCalculatedAt).toLocaleDateString('de-AT')}
      </p>
    </div>
  )
}
```

**Test:**
```typescript
// apps/web/components/dashboard/__tests__/revenue-threshold-widget.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { RevenueThresholdWidget } from '../revenue-threshold-widget'

describe('RevenueThresholdWidget', () => {
  it('should render loading state initially', () => {
    render(<RevenueThresholdWidget />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should display revenue data after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        currentYearRevenue: 30000,
        thresholdPercentage: 54.5,
        isApproaching: false,
        isCritical: false
      })
    })

    render(<RevenueThresholdWidget />)

    await waitFor(() => {
      expect(screen.getByText(/€30,000/)).toBeInTheDocument()
    })
  })

  it('should show warning when approaching threshold', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        currentYearRevenue: 40000,
        thresholdPercentage: 72.7,
        isApproaching: true,
        isCritical: false
      })
    })

    render(<RevenueThresholdWidget />)

    await waitFor(() => {
      expect(screen.getByText(/Warning/)).toBeInTheDocument()
    })
  })
})
```

---

### Task 8: UI Component - VAT Rate Warning
**Priority:** MEDIUM | **Estimated Time:** 2 hours | **Dependencies:** Task 2

#### 8.1 Create VAT Rate Warning Component
- [ ] Create `apps/web/components/services/vat-rate-warning.tsx`
- [ ] Implement warning logic for therapy services
- [ ] Add educational tooltip
- [ ] Integrate into service form

**Implementation:**
```typescript
// apps/web/components/services/vat-rate-warning.tsx
'use client'

import { AlertTriangle, Info } from 'lucide-react'

interface VATRateWarningProps {
  category: string
  vatRate: string
}

export function VATRateWarning({ category, vatRate }: VATRateWarningProps) {
  const shouldWarn = category === 'MASSAGE' && vatRate === 'UST_10'
  const shouldAlert = category === 'MASSAGE' && vatRate === 'UST_13'

  if (!shouldWarn && !shouldAlert) return null

  return (
    <div className={`rounded-lg p-4 mb-4 ${
      shouldAlert ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-start">
        <AlertTriangle className={`w-5 h-5 mr-3 mt-0.5 ${
          shouldAlert ? 'text-red-600' : 'text-yellow-600'
        }`} />
        <div className="flex-1">
          <h4 className={`font-semibold mb-1 ${
            shouldAlert ? 'text-red-800' : 'text-yellow-800'
          }`}>
            Unusual VAT Rate for Massage Therapy
          </h4>
          <p className={`text-sm mb-2 ${
            shouldAlert ? 'text-red-700' : 'text-yellow-700'
          }`}>
            The {vatRate === 'UST_10' ? '10%' : '13%'} reduced VAT rate is not standard for massage therapy services in Austria.
          </p>
          <div className={`text-sm ${
            shouldAlert ? 'text-red-700' : 'text-yellow-700'
          }`}>
            <strong>Standard rates for massage therapy:</strong>
            <ul className="list-disc ml-5 mt-1">
              <li><strong>0% (Kleinunternehmer)</strong> - Most common for therapists under €55,000 annual revenue</li>
              <li><strong>20% (Standard rate)</strong> - For VAT-registered therapists</li>
            </ul>
          </div>
          <p className={`text-sm mt-2 ${
            shouldAlert ? 'text-red-700' : 'text-yellow-700'
          }`}>
            ⚠️ <strong>Recommendation:</strong> Consult your tax advisor before using this rate to ensure compliance.
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Test:**
```typescript
// apps/web/components/services/__tests__/vat-rate-warning.test.tsx
import { render, screen } from '@testing-library/react'
import { VATRateWarning } from '../vat-rate-warning'

describe('VATRateWarning', () => {
  it('should not render for standard VAT rates', () => {
    const { container } = render(
      <VATRateWarning category="MASSAGE" vatRate="KLEINUNTERNEHMER" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render warning for 10% VAT on massage', () => {
    render(<VATRateWarning category="MASSAGE" vatRate="UST_10" />)
    expect(screen.getByText(/Unusual VAT Rate/)).toBeInTheDocument()
  })

  it('should render warning for 13% VAT on massage', () => {
    render(<VATRateWarning category="MASSAGE" vatRate="UST_13" />)
    expect(screen.getByText(/Unusual VAT Rate/)).toBeInTheDocument()
  })

  it('should not render for non-massage services', () => {
    const { container } = render(
      <VATRateWarning category="CONSULTING" vatRate="UST_10" />
    )
    expect(container.firstChild).toBeNull()
  })
})
```

---

### Task 9: UI Component - Invoice Branding Settings
**Priority:** MEDIUM | **Estimated Time:** 4 hours | **Dependencies:** Task 5

#### 9.1 Create Invoice Branding Settings Component
- [ ] Create `apps/web/components/settings/invoice-branding-section.tsx`
- [ ] Implement logo upload with preview
- [ ] Add display preference selector
- [ ] Add thank you message textarea
- [ ] Integrate into settings page

**Implementation:**
```typescript
// apps/web/components/settings/invoice-branding-section.tsx
'use client'

import { useState } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'

export function InvoiceBrandingSection() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [displayPreference, setDisplayPreference] = useState<'LOGO' | 'NAME' | 'BOTH'>('NAME')
  const [thankYouMessage, setThankYouMessage] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl,
          displayPreference,
          thankYouMessage: thankYouMessage || null
        })
      })

      if (!response.ok) throw new Error('Failed to save')

      // Success feedback
      alert('Invoice branding settings saved successfully!')
    } catch (error) {
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Invoice Branding
      </h3>

      {/* Logo Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Practice Logo
        </label>
        <div className="flex items-start space-x-4">
          {logoUrl ? (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <img src={logoUrl} alt="Logo preview" className="max-h-24 max-w-xs" />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No logo uploaded</p>
            </div>
          )}
          <div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Upload Logo
            </button>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, or SVG. Max 2MB. Recommended: 800x200px
            </p>
          </div>
        </div>
      </div>

      {/* Display Preference */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invoice Header Display
        </label>
        <div className="space-y-2">
          {[
            { value: 'NAME', label: 'Business Name Only', description: 'Traditional text-only header' },
            { value: 'LOGO', label: 'Logo Only', description: 'Logo without business name' },
            { value: 'BOTH', label: 'Logo + Business Name', description: 'Logo with name beneath' }
          ].map(option => (
            <label key={option.value} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="displayPreference"
                value={option.value}
                checked={displayPreference === option.value}
                onChange={(e) => setDisplayPreference(e.target.value as any)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Thank You Message */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thank You Message (Optional)
        </label>
        <textarea
          value={thankYouMessage}
          onChange={(e) => setThankYouMessage(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-3"
          placeholder="e.g., 'Thank you for your trust in our services. We look forward to your next visit!'"
        />
        <p className="text-xs text-gray-500 mt-1">
          {thankYouMessage.length}/500 characters
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Branding Settings'}
      </button>
    </div>
  )
}
```

**Test:**
```typescript
// apps/web/components/settings/__tests__/invoice-branding-section.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InvoiceBrandingSection } from '../invoice-branding-section'

describe('InvoiceBrandingSection', () => {
  it('should render all form fields', () => {
    render(<InvoiceBrandingSection />)
    expect(screen.getByText(/Invoice Branding/)).toBeInTheDocument()
    expect(screen.getByText(/Practice Logo/)).toBeInTheDocument()
    expect(screen.getByText(/Thank You Message/)).toBeInTheDocument()
  })

  it('should save branding settings on submit', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })

    render(<InvoiceBrandingSection />)

    const saveButton = screen.getByText(/Save Branding Settings/)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings/invoice-branding',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })
})
```

---

### Task 10: PDF Generation Updates
**Priority:** HIGH | **Estimated Time:** 4 hours | **Dependencies:** Task 1

#### 10.1 Update PDF Generator for Logo and Branding
- [ ] Modify `packages/lib/src/pdf-generator.ts`
- [ ] Add logo rendering in invoice header
- [ ] Implement display preference logic
- [ ] Add thank you message section
- [ ] Add draft watermark overlay
- [ ] Add validation disclaimer footer

**Implementation:**
```typescript
// packages/lib/src/pdf-generator.ts (modifications)

async function generateInvoiceHTML(
  invoice: InvoiceWithRelations,
  therapistInfo: TherapistInfo
): Promise<string> {
  // Add draft watermark if status is DRAFT
  const watermarkHTML = invoice.status === 'DRAFT' ? `
    <div class="watermark">ENTWURF</div>
  ` : ''

  // Add watermark CSS
  const watermarkCSS = `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120pt;
      color: rgba(0, 0, 0, 0.05);
      font-weight: bold;
      pointer-events: none;
      z-index: 1000;
      user-select: none;
    }
  `

  // Update header rendering logic
  const renderInvoiceHeader = () => {
    const { invoiceLogoUrl, invoiceDisplayPreference } = therapistInfo

    switch (invoiceDisplayPreference) {
      case 'LOGO':
        return invoiceLogoUrl
          ? `<img src="${invoiceLogoUrl}" alt="Logo" style="max-height: 80px; max-width: 300px;" />`
          : `<div class="bold" style="font-size: 14pt; color: #1f2937;">${therapistInfo.name}</div>`

      case 'BOTH':
        return `
          ${invoiceLogoUrl ? `<img src="${invoiceLogoUrl}" alt="Logo" style="max-height: 60px; max-width: 250px; margin-bottom: 10px;" />` : ''}
          <div class="bold" style="font-size: 14pt; color: #1f2937;">${therapistInfo.name}</div>
        `

      case 'NAME':
      default:
        return `<div class="bold" style="font-size: 14pt; color: #1f2937;">${therapistInfo.name}</div>`
    }
  }

  // Add thank you message section
  const thankYouHTML = therapistInfo.invoiceThankYouMessage ? `
    <div class="thank-you-message" style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-style: italic; color: #1e40af;">
        ${therapistInfo.invoiceThankYouMessage}
      </p>
    </div>
  ` : ''

  // Add validation disclaimer
  const validationDisclaimerHTML = !therapistInfo.taxValidationStatus ? `
    <div class="validation-disclaimer" style="background-color: #fef7cd; padding: 15px; border-left: 4px solid #eab308; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">
        ⚠️ Wichtiger Hinweis zur Steuerberatung:
      </p>
      <p style="margin: 0 0 10px 0; color: #92400e; font-size: 10pt;">
        Diese Rechnung wurde mit MyoFlow erstellt und folgt den gesetzlichen Anforderungen nach bestem Wissen.
        Die steuerliche Korrektheit wurde noch nicht von einem Steuerberater geprüft.
        Bei Fragen zur steuerlichen Behandlung wenden Sie sich bitte an einen Steuerberater.
      </p>
      <p style="margin: 0; color: #92400e; font-size: 8pt; font-style: italic;">
        <strong>Tax Advisory Notice:</strong> This invoice was generated using MyoFlow software and follows
        legal requirements to the best of our knowledge. Tax correctness has not been validated by a
        professional tax advisor. Please consult a tax professional for tax-related questions.
      </p>
    </div>
  ` : `
    <div class="validation-badge" style="background-color: #f0fdf4; padding: 10px; border-left: 4px solid: #10b981; margin: 15px 0; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-size: 9pt;">
        ✓ Steuerlich geprüft am ${formatDate(therapistInfo.taxValidatedAt!)}
        ${therapistInfo.taxValidatedBy ? ` durch ${therapistInfo.taxValidatedBy}` : ''}
      </p>
    </div>
  `

  // ... rest of HTML generation with updated header, watermark, thank you message, and disclaimer
}
```

**Test:**
```typescript
// packages/lib/__tests__/pdf-generator-branding.test.ts
import { generateInvoicePDF } from '../src/pdf-generator'

describe('PDF Generator - Branding Features', () => {
  it('should include logo when logoUrl is provided', async () => {
    const invoice = { /* mock invoice */ }
    const therapistInfo = {
      /* ... */
      invoiceLogoUrl: 'https://example.com/logo.png',
      invoiceDisplayPreference: 'LOGO'
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const html = pdf.toString()

    expect(html).toContain('https://example.com/logo.png')
  })

  it('should add watermark for DRAFT invoices', async () => {
    const invoice = { /* ... */ status: 'DRAFT' }
    const therapistInfo = { /* ... */ }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const html = pdf.toString()

    expect(html).toContain('ENTWURF')
    expect(html).toContain('watermark')
  })

  it('should include thank you message when provided', async () => {
    const invoice = { /* ... */ }
    const therapistInfo = {
      /* ... */
      invoiceThankYouMessage: 'Thank you for your business!'
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const html = pdf.toString()

    expect(html).toContain('Thank you for your business!')
  })

  it('should show validation disclaimer when not validated', async () => {
    const invoice = { /* ... */ }
    const therapistInfo = {
      /* ... */
      taxValidationStatus: false
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const html = pdf.toString()

    expect(html).toContain('Wichtiger Hinweis zur Steuerberatung')
  })
})
```

---

### Task 11: Integration & E2E Testing
**Priority:** MEDIUM | **Estimated Time:** 3 hours | **Dependencies:** All previous tasks

#### 11.1 Create E2E Tests for Invoice Customization Flow
- [ ] Create `apps/web/e2e/invoice-customization.spec.ts`
- [ ] Test logo upload and preview
- [ ] Test branding settings save
- [ ] Test revenue threshold widget display
- [ ] Test VAT rate warning appearance

**Implementation:**
```typescript
// apps/web/e2e/invoice-customization.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Invoice Customization', () => {
  test.beforeEach(async ({ page }) => {
    // Login as therapist
    await page.goto('/auth/sign-in')
    await page.fill('input[name="email"]', 'therapist@test.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
  })

  test('should display invoice branding settings', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.locator('text=Invoice Branding')).toBeVisible()
    await expect(page.locator('text=Practice Logo')).toBeVisible()
    await expect(page.locator('text=Invoice Header Display')).toBeVisible()
  })

  test('should save branding preferences', async ({ page }) => {
    await page.goto('/dashboard/settings')

    // Select display preference
    await page.click('input[value="LOGO"]')

    // Add thank you message
    await page.fill('textarea[placeholder*="Thank you"]', 'Thank you for choosing our practice!')

    // Save
    await page.click('button:has-text("Save Branding Settings")')

    // Wait for success feedback
    await expect(page.locator('text=saved successfully')).toBeVisible()
  })

  test('should display revenue threshold widget on dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('text=Kleinunternehmer Threshold')).toBeVisible()
    await expect(page.locator('text=of €55,000')).toBeVisible()
  })

  test('should show VAT rate warning for unusual rates', async ({ page }) => {
    await page.goto('/dashboard/services/new')

    // Select MASSAGE category
    await page.selectOption('select[name="category"]', 'MASSAGE')

    // Select unusual VAT rate
    await page.selectOption('select[name="vatRate"]', 'UST_10')

    // Verify warning appears
    await expect(page.locator('text=Unusual VAT Rate')).toBeVisible()
  })
})
```

---

### Task 12: Documentation & Cleanup
**Priority:** LOW | **Estimated Time:** 2 hours | **Dependencies:** All previous tasks

#### 12.1 Update Documentation
- [ ] Update `README.md` with invoice customization features
- [ ] Create user guide for invoice branding settings
- [ ] Document API endpoints in API spec
- [ ] Update migration guide for existing users

#### 12.2 Final Quality Checks
- [ ] Run `pnpm typecheck` - ensure zero errors
- [ ] Run `pnpm lint` - ensure zero warnings
- [ ] Run `pnpm build` - ensure successful build
- [ ] Run `pnpm test` - ensure all tests pass
- [ ] Manual QA testing of all features
- [ ] Performance audit (PDF generation <2s)

---

## Summary

**Total Estimated Time:** 31 hours

**Task Breakdown:**
- Database & Schema: 3 hours (Tasks 1-2)
- API Development: 7 hours (Tasks 3-6)
- UI Components: 9 hours (Tasks 7-9)
- PDF Generation: 4 hours (Task 10)
- Testing: 6 hours (Tasks 1-11 tests)
- Documentation: 2 hours (Task 12)

**Critical Path:**
1. Database schema (Task 1) → Types (Task 2) → Revenue logic (Task 3) → API routes (Tasks 4-6)
2. UI components depend on API routes (Tasks 7-9)
3. PDF updates can run in parallel (Task 10)
4. E2E testing requires all features complete (Task 11)

**Testing Strategy:**
- Write unit tests first for each component (TDD approach)
- Integration tests for API endpoints
- E2E tests for complete user workflows
- Manual QA for PDF generation and visual elements

**Deployment Checklist:**
- ✅ All tests passing
- ✅ Migration applied to production database
- ✅ Environment variables configured (if needed for file upload)
- ✅ User documentation published
- ✅ Monitoring for revenue calculation performance
