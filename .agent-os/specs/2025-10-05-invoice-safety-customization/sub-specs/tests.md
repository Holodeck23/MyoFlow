# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-10-05-invoice-safety-customization/spec.md

> Created: 2025-10-05
> Version: 1.0.0

## Test Coverage

### Coverage Goals

**Target Coverage:** ≥80% for all new features

**Coverage Breakdown:**
- Unit Tests: 90% (business logic, utilities)
- Integration Tests: 80% (API endpoints, database operations)
- E2E Tests: 70% (critical user workflows)
- Manual QA: 100% (visual elements, PDF generation)

### Test Pyramid

```
           E2E Tests (30%)
        ┌─────────────────┐
        │  User Workflows │
        └─────────────────┘

     Integration Tests (40%)
    ┌─────────────────────────┐
    │  API Routes & Database  │
    └─────────────────────────┘

      Unit Tests (30%)
┌───────────────────────────────┐
│ Business Logic & Utilities    │
└───────────────────────────────┘
```

## Test Coverage

### 1. Unit Tests

#### 1.1 Revenue Calculator Tests

**File:** `packages/lib/__tests__/revenue-calculator.test.ts`

**Coverage:** 100%

```typescript
import { calculateCurrentYearRevenue } from '../src/revenue-calculator'
import { PrismaClient } from '@myoflow/db'
import { mockDeep, mockReset } from 'jest-mock-extended'

const prismaMock = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(prismaMock)
})

describe('Revenue Calculator', () => {
  describe('calculateCurrentYearRevenue', () => {
    it('should calculate revenue from invoices', async () => {
      prismaMock.therapist.findUnique.mockResolvedValue({
        id: 'therapist-1',
        annualGrossCents: 0,
        annualGrossCachedAt: null
      })

      prismaMock.invoice.findMany.mockResolvedValue([
        { totalGrossCents: 1000000 }, // €10,000
        { totalGrossCents: 2000000 }, // €20,000
        { totalGrossCents: 1500000 }  // €15,000
      ])

      const result = await calculateCurrentYearRevenue(prismaMock, 'therapist-1')

      expect(result.currentYearRevenueCents).toBe(4500000) // €45,000
      expect(result.currentYearRevenue).toBe(45000)
      expect(result.thresholdPercentage).toBeCloseTo(81.82, 2)
    })

    it('should use cached value when cache is valid', async () => {
      const cachedAt = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago

      prismaMock.therapist.findUnique.mockResolvedValue({
        id: 'therapist-1',
        annualGrossCents: 3000000,
        annualGrossCachedAt: cachedAt
      })

      const result = await calculateCurrentYearRevenue(prismaMock, 'therapist-1')

      expect(result.currentYearRevenueCents).toBe(3000000)
      expect(result.fromCache).toBe(true)
      expect(prismaMock.invoice.findMany).not.toHaveBeenCalled()
    })

    it('should recalculate when cache is expired', async () => {
      const cachedAt = new Date(Date.now() - 1000 * 60 * 60 * 25) // 25 hours ago

      prismaMock.therapist.findUnique.mockResolvedValue({
        id: 'therapist-1',
        annualGrossCents: 3000000,
        annualGrossCachedAt: cachedAt
      })

      prismaMock.invoice.findMany.mockResolvedValue([
        { totalGrossCents: 4000000 }
      ])

      const result = await calculateCurrentYearRevenue(prismaMock, 'therapist-1')

      expect(result.currentYearRevenueCents).toBe(4000000)
      expect(result.fromCache).toBe(false)
      expect(prismaMock.invoice.findMany).toHaveBeenCalled()
    })

    it('should force refresh when requested', async () => {
      prismaMock.therapist.findUnique.mockResolvedValue({
        id: 'therapist-1',
        annualGrossCents: 3000000,
        annualGrossCachedAt: new Date() // Fresh cache
      })

      prismaMock.invoice.findMany.mockResolvedValue([
        { totalGrossCents: 5000000 }
      ])

      const result = await calculateCurrentYearRevenue(
        prismaMock,
        'therapist-1',
        true // forceRefresh
      )

      expect(result.currentYearRevenueCents).toBe(5000000)
      expect(result.fromCache).toBe(false)
    })

    it('should mark as approaching when ≥70%', async () => {
      prismaMock.therapist.findUnique.mockResolvedValue({
        id: 'therapist-1',
        annualGrossCents: 0,
        annualGrossCachedAt: null
      })

      prismaMock.invoice.findMany.mockResolvedValue([
        { totalGrossCents: 4000000 } // €40,000 (72.7%)
      ])

      const result = await calculateCurrentYearRevenue(prismaMock, 'therapist-1')

      expect(result.isApproaching).toBe(true)
      expect(result.isCritical).toBe(false)
    })

    it('should mark as critical when ≥90%', async () => {
      prismaMock.therapist.findUnique.mockResolvedValue({
        id: 'therapist-1',
        annualGrossCents: 0,
        annualGrossCachedAt: null
      })

      prismaMock.invoice.findMany.mockResolvedValue([
        { totalGrossCents: 5000000 } // €50,000 (90.9%)
      ])

      const result = await calculateCurrentYearRevenue(prismaMock, 'therapist-1')

      expect(result.isApproaching).toBe(true)
      expect(result.isCritical).toBe(true)
    })

    it('should handle zero revenue', async () => {
      prismaMock.therapist.findUnique.mockResolvedValue({
        id: 'therapist-1',
        annualGrossCents: 0,
        annualGrossCachedAt: null
      })

      prismaMock.invoice.findMany.mockResolvedValue([])

      const result = await calculateCurrentYearRevenue(prismaMock, 'therapist-1')

      expect(result.currentYearRevenueCents).toBe(0)
      expect(result.thresholdPercentage).toBe(0)
      expect(result.isApproaching).toBe(false)
    })

    it('should throw error when therapist not found', async () => {
      prismaMock.therapist.findUnique.mockResolvedValue(null)

      await expect(
        calculateCurrentYearRevenue(prismaMock, 'invalid-id')
      ).rejects.toThrow('Therapist not found')
    })
  })
})
```

**Test Cases: 8**
**Coverage: 100%**

---

#### 1.2 VAT Rate Warning Logic Tests

**File:** `apps/web/lib/__tests__/vat-rate-warning.test.ts`

```typescript
import { shouldShowVATWarning, getVATWarning } from '../vat-rate-warning'

describe('VAT Rate Warning Logic', () => {
  it('should warn for 10% VAT on massage services', () => {
    expect(shouldShowVATWarning('MASSAGE', 'UST_10')).toBe(true)
  })

  it('should warn for 13% VAT on massage services', () => {
    expect(shouldShowVATWarning('MASSAGE', 'UST_13')).toBe(true)
  })

  it('should not warn for 0% VAT (Kleinunternehmer)', () => {
    expect(shouldShowVATWarning('MASSAGE', 'KLEINUNTERNEHMER')).toBe(false)
  })

  it('should not warn for 20% VAT', () => {
    expect(shouldShowVATWarning('MASSAGE', 'UST_20')).toBe(false)
  })

  it('should not warn for non-massage services', () => {
    expect(shouldShowVATWarning('CONSULTING', 'UST_10')).toBe(false)
    expect(shouldShowVATWarning('YOGA', 'UST_13')).toBe(false)
  })

  it('should return correct warning message', () => {
    const warning = getVATWarning('MASSAGE', 'UST_10')
    expect(warning.message).toContain('10%')
    expect(warning.severity).toBe('warning')
  })
})
```

**Test Cases: 6**

---

#### 1.3 Invoice Validation Tests

**File:** `packages/lib/__tests__/invoice-validation.test.ts`

```typescript
import { validateInvoice } from '../src/invoice-validation'

describe('Invoice Validation', () => {
  it('should pass validation for complete invoice', () => {
    const result = validateInvoice({
      totalGrossCents: 50000,
      client: { address: 'Street 1', postalCode: '4020', city: 'Linz' },
      therapist: { iban: 'AT611904300234573201', taxValidationStatus: true }
    })

    expect(result.canGenerate).toBe(true)
    expect(result.warnings).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
    expect(result.readinessScore).toBe(100)
  })

  it('should error for missing client address on invoice >€400', () => {
    const result = validateInvoice({
      totalGrossCents: 50000, // €500
      client: { address: null, postalCode: null, city: null }
    })

    expect(result.canGenerate).toBe(false)
    expect(result.errors).toContain('Client address required for invoices over €400')
  })

  it('should allow missing address for invoice ≤€400', () => {
    const result = validateInvoice({
      totalGrossCents: 30000, // €300
      client: { address: null, postalCode: null, city: null }
    })

    expect(result.canGenerate).toBe(true)
  })

  it('should warn when tax validation missing', () => {
    const result = validateInvoice({
      totalGrossCents: 50000,
      therapist: { taxValidationStatus: false }
    })

    expect(result.canGenerate).toBe(true)
    expect(result.warnings).toContain('Invoice settings not professionally validated')
  })

  it('should warn for invalid IBAN', () => {
    const result = validateInvoice({
      therapist: { iban: 'INVALID_IBAN' }
    })

    expect(result.warnings).toContain('Invalid IBAN format')
  })
})
```

**Test Cases: 5**

---

### 2. Integration Tests

#### 2.1 Revenue Status API Tests

**File:** `apps/web/app/api/compliance/revenue-status/__tests__/route.test.ts`

```typescript
import { GET } from '../route'
import { auth } from '@/lib/auth'
import { requireTherapist } from '@/lib/require-therapist'
import { calculateCurrentYearRevenue } from '@myoflow/lib/revenue-calculator'

jest.mock('@/lib/auth')
jest.mock('@/lib/require-therapist')
jest.mock('@myoflow/lib/revenue-calculator')

describe('GET /api/compliance/revenue-status', () => {
  it('should return 401 when not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(data.code).toBe('AUTH_REQUIRED')
  })

  it('should return revenue status for authenticated therapist', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    (requireTherapist as jest.Mock).mockResolvedValue({ id: 'therapist-1' })
    (calculateCurrentYearRevenue as jest.Mock).mockResolvedValue({
      currentYearRevenue: 42500,
      currentYearRevenueCents: 4250000,
      thresholdPercentage: 77.27,
      threshold: 55000,
      thresholdCents: 5500000,
      isApproaching: true,
      isCritical: false,
      year: 2025,
      lastCalculatedAt: new Date(),
      fromCache: true
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.currentYearRevenue).toBe(42500)
    expect(data.isApproaching).toBe(true)
  })

  it('should handle calculation errors gracefully', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    (requireTherapist as jest.Mock).mockResolvedValue({ id: 'therapist-1' })
    (calculateCurrentYearRevenue as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to calculate revenue status')
  })
})
```

**Test Cases: 3**

---

#### 2.2 Invoice Branding API Tests

**File:** `apps/web/app/api/settings/invoice-branding/__tests__/route.test.ts`

```typescript
import { PUT } from '../route'
import { auth } from '@/lib/auth'
import { requireTherapist } from '@/lib/require-therapist'
import { prisma } from '@myoflow/db'

jest.mock('@/lib/auth')
jest.mock('@/lib/require-therapist')
jest.mock('@myoflow/db')

describe('PUT /api/settings/invoice-branding', () => {
  it('should update logo URL', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    (requireTherapist as jest.Mock).mockResolvedValue({ id: 'therapist-1' })

    const mockUpdate = jest.fn().mockResolvedValue({
      invoiceLogoUrl: 'https://example.com/logo.png',
      invoiceDisplayPreference: 'LOGO',
      invoiceThankYouMessage: null
    })

    ;(prisma.therapist.update as jest.Mock) = mockUpdate

    const request = new Request('http://localhost/api/settings/invoice-branding', {
      method: 'PUT',
      body: JSON.stringify({
        logoUrl: 'https://example.com/logo.png',
        displayPreference: 'LOGO'
      })
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.invoiceLogoUrl).toBe('https://example.com/logo.png')
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'therapist-1' },
      data: expect.objectContaining({
        invoiceLogoUrl: 'https://example.com/logo.png',
        invoiceDisplayPreference: 'LOGO'
      })
    })
  })

  it('should reject invalid display preference', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    (requireTherapist as jest.Mock).mockResolvedValue({ id: 'therapist-1' })

    const request = new Request('http://localhost/api/settings/invoice-branding', {
      method: 'PUT',
      body: JSON.stringify({
        displayPreference: 'INVALID'
      })
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('should reject thank you message >500 chars', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    (requireTherapist as jest.Mock).mockResolvedValue({ id: 'therapist-1' })

    const request = new Request('http://localhost/api/settings/invoice-branding', {
      method: 'PUT',
      body: JSON.stringify({
        thankYouMessage: 'x'.repeat(501)
      })
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })
})
```

**Test Cases: 3**

---

#### 2.3 Compliance Checklist API Tests

**File:** `apps/web/app/api/compliance/checklist/__tests__/route.test.ts`

```typescript
import { GET } from '../route'
import { auth } from '@/lib/auth'
import { requireTherapist } from '@/lib/require-therapist'
import { prisma } from '@myoflow/db'

describe('GET /api/compliance/checklist', () => {
  it('should calculate readiness score correctly', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    (requireTherapist as jest.Mock).mockResolvedValue({
      id: 'therapist-1',
      taxValidationStatus: false,
      invoiceLogoUrl: 'https://example.com/logo.png',
      annualGrossCachedAt: new Date(),
      taxAdvisorName: null
    })

    ;(prisma.service.findMany as jest.Mock).mockResolvedValue([
      { vatRate: 'KLEINUNTERNEHMER' }
    ])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.readinessScore).toBeGreaterThanOrEqual(0)
    expect(data.readinessScore).toBeLessThanOrEqual(100)
  })

  it('should include warnings for missing items', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } })
    (requireTherapist as jest.Mock).mockResolvedValue({
      id: 'therapist-1',
      taxValidationStatus: false,
      taxAdvisorName: null
    })

    const response = await GET()
    const data = await response.json()

    expect(Array.isArray(data.warnings)).toBe(true)
    expect(data.warnings).toContain('Invoice settings not professionally validated')
  })
})
```

**Test Cases: 2**

---

### 3. E2E Tests (Playwright)

#### 3.1 Invoice Customization Flow

**File:** `apps/web/e2e/invoice-customization.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Invoice Customization', () => {
  test.beforeEach(async ({ page }) => {
    // Login as therapist
    await page.goto('/auth/sign-in')
    await page.fill('input[name="email"]', 'therapist@test.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should display invoice branding settings', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.locator('text=Invoice Branding')).toBeVisible()
    await expect(page.locator('text=Practice Logo')).toBeVisible()
    await expect(page.locator('text=Invoice Header Display')).toBeVisible()
    await expect(page.locator('text=Thank You Message')).toBeVisible()
  })

  test('should update display preference', async ({ page }) => {
    await page.goto('/dashboard/settings')

    // Select LOGO preference
    await page.click('input[value="LOGO"]')

    // Save settings
    await page.click('button:has-text("Save Branding Settings")')

    // Wait for success notification
    await expect(page.locator('text=saved successfully')).toBeVisible({ timeout: 5000 })
  })

  test('should add thank you message', async ({ page }) => {
    await page.goto('/dashboard/settings')

    const message = 'Thank you for choosing our practice!'
    await page.fill('textarea[placeholder*="Thank you"]', message)

    await page.click('button:has-text("Save Branding Settings")')

    await expect(page.locator('text=saved successfully')).toBeVisible()

    // Verify message persists after reload
    await page.reload()
    await expect(page.locator(`textarea[value="${message}"]`)).toBeVisible()
  })

  test('should enforce 500 character limit on thank you message', async ({ page }) => {
    await page.goto('/dashboard/settings')

    const longMessage = 'x'.repeat(501)
    await page.fill('textarea[placeholder*="Thank you"]', longMessage)

    await page.click('button:has-text("Save Branding Settings")')

    // Should show validation error
    await expect(page.locator('text=/max.*500.*character/i')).toBeVisible()
  })
})
```

**Test Cases: 4**

---

#### 3.2 Revenue Threshold Widget

**File:** `apps/web/e2e/revenue-threshold.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Revenue Threshold Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in')
    await page.fill('input[name="email"]', 'therapist@test.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should display revenue threshold widget', async ({ page }) => {
    await expect(page.locator('text=Kleinunternehmer Threshold')).toBeVisible()
    await expect(page.locator('text=of €55,000')).toBeVisible()
  })

  test('should show progress bar', async ({ page }) => {
    const progressBar = page.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()

    // Verify progress bar has valid width
    const width = await progressBar.evaluate(el =>
      window.getComputedStyle(el).width
    )
    expect(parseInt(width)).toBeGreaterThan(0)
  })

  test('should display warning when approaching threshold', async ({ page }) => {
    // Seed database with high revenue (>70%)
    // ... (requires test data setup)

    await page.goto('/dashboard')

    await expect(page.locator('text=/approaching.*threshold/i')).toBeVisible()
  })

  test('should update after creating invoice', async ({ page }) => {
    // Get initial revenue
    const initialRevenue = await page.locator('[data-testid="current-revenue"]').textContent()

    // Create new invoice
    await page.goto('/dashboard/invoices/new')
    // ... (complete invoice creation flow)

    // Return to dashboard
    await page.goto('/dashboard')

    // Verify revenue updated
    const updatedRevenue = await page.locator('[data-testid="current-revenue"]').textContent()
    expect(updatedRevenue).not.toBe(initialRevenue)
  })
})
```

**Test Cases: 4**

---

#### 3.3 VAT Rate Warning

**File:** `apps/web/e2e/vat-rate-warning.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('VAT Rate Warning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in')
    await page.fill('input[name="email"]', 'therapist@test.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
  })

  test('should show warning for unusual VAT rate on massage service', async ({ page }) => {
    await page.goto('/dashboard/services/new')

    // Select MASSAGE category
    await page.selectOption('select[name="category"]', 'MASSAGE')

    // Select unusual VAT rate (10%)
    await page.selectOption('select[name="vatRate"]', 'UST_10')

    // Verify warning appears
    await expect(page.locator('text=/unusual.*vat.*rate/i')).toBeVisible()
    await expect(page.locator('text=/consult.*tax.*advisor/i')).toBeVisible()
  })

  test('should not show warning for standard rates', async ({ page }) => {
    await page.goto('/dashboard/services/new')

    await page.selectOption('select[name="category"]', 'MASSAGE')
    await page.selectOption('select[name="vatRate"]', 'KLEINUNTERNEHMER')

    // Warning should not appear
    await expect(page.locator('text=/unusual.*vat.*rate/i')).not.toBeVisible()
  })

  test('should not show warning for non-massage services', async ({ page }) => {
    await page.goto('/dashboard/services/new')

    await page.selectOption('select[name="category"]', 'CONSULTING')
    await page.selectOption('select[name="vatRate"]', 'UST_10')

    // Warning should not appear for non-massage
    await expect(page.locator('text=/unusual.*vat.*rate/i')).not.toBeVisible()
  })
})
```

**Test Cases: 3**

---

### 4. PDF Generation Tests

#### 4.1 Invoice Branding in PDFs

**File:** `packages/lib/__tests__/pdf-generator-branding.test.ts`

```typescript
import { generateInvoicePDF } from '../src/pdf-generator'

describe('PDF Generator - Branding', () => {
  it('should include logo when logoUrl provided and preference is LOGO', async () => {
    const invoice = createMockInvoice()
    const therapistInfo = {
      ...createMockTherapist(),
      invoiceLogoUrl: 'https://example.com/logo.png',
      invoiceDisplayPreference: 'LOGO'
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const htmlBuffer = pdf.toString()

    expect(htmlBuffer).toContain('<img src="https://example.com/logo.png"')
    expect(htmlBuffer).toContain('alt="Logo"')
  })

  it('should show business name when preference is NAME', async () => {
    const invoice = createMockInvoice()
    const therapistInfo = {
      ...createMockTherapist(),
      name: 'Test Practice',
      invoiceDisplayPreference: 'NAME'
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const htmlBuffer = pdf.toString()

    expect(htmlBuffer).toContain('Test Practice')
    expect(htmlBuffer).not.toContain('<img')
  })

  it('should show both logo and name when preference is BOTH', async () => {
    const invoice = createMockInvoice()
    const therapistInfo = {
      ...createMockTherapist(),
      name: 'Test Practice',
      invoiceLogoUrl: 'https://example.com/logo.png',
      invoiceDisplayPreference: 'BOTH'
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const htmlBuffer = pdf.toString()

    expect(htmlBuffer).toContain('<img src="https://example.com/logo.png"')
    expect(htmlBuffer).toContain('Test Practice')
  })

  it('should add watermark for DRAFT invoices', async () => {
    const invoice = createMockInvoice({ status: 'DRAFT' })
    const therapistInfo = createMockTherapist()

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const htmlBuffer = pdf.toString()

    expect(htmlBuffer).toContain('ENTWURF')
    expect(htmlBuffer).toContain('class="watermark"')
  })

  it('should not add watermark for SENT invoices', async () => {
    const invoice = createMockInvoice({ status: 'SENT' })
    const therapistInfo = createMockTherapist()

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const htmlBuffer = pdf.toString()

    expect(htmlBuffer).not.toContain('ENTWURF')
    expect(htmlBuffer).not.toContain('class="watermark"')
  })

  it('should include thank you message when provided', async () => {
    const invoice = createMockInvoice()
    const therapistInfo = {
      ...createMockTherapist(),
      invoiceThankYouMessage: 'Thank you for your business!'
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const htmlBuffer = pdf.toString()

    expect(htmlBuffer).toContain('Thank you for your business!')
  })

  it('should show validation disclaimer when not validated', async () => {
    const invoice = createMockInvoice()
    const therapistInfo = {
      ...createMockTherapist(),
      taxValidationStatus: false
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const htmlBuffer = pdf.toString()

    expect(htmlBuffer).toContain('Wichtiger Hinweis zur Steuerberatung')
    expect(htmlBuffer).toContain('Tax Advisory Notice')
  })

  it('should show validation badge when validated', async () => {
    const invoice = createMockInvoice()
    const therapistInfo = {
      ...createMockTherapist(),
      taxValidationStatus: true,
      taxValidatedAt: new Date('2025-09-15'),
      taxValidatedBy: 'John Doe'
    }

    const pdf = await generateInvoicePDF(invoice, therapistInfo)
    const htmlBuffer = pdf.toString()

    expect(htmlBuffer).toContain('Steuerlich geprüft')
    expect(htmlBuffer).toContain('15.09.2025')
  })
})
```

**Test Cases: 8**

---

## Mocking Requirements

### Mock Data Factories

**File:** `apps/web/__tests__/factories/invoice.factory.ts`

```typescript
export function createMockInvoice(overrides = {}) {
  return {
    id: 'invoice-1',
    number: 'INV-2025-001',
    status: 'DRAFT',
    totalGrossCents: 10000,
    lines: [],
    vatBreakdown: [],
    kleinunternehmer: true,
    createdAt: new Date(),
    Client: {
      id: 'client-1',
      name: 'John Doe',
      email: 'john@example.com',
      street: 'Main St 1',
      postalCode: '4020',
      city: 'Linz'
    },
    ...overrides
  }
}

export function createMockTherapist(overrides = {}) {
  return {
    id: 'therapist-1',
    name: 'Test Practice',
    address: 'Business St 1',
    city: 'Linz',
    postalCode: '4020',
    phone: '+43 123 456789',
    email: 'practice@example.com',
    kleinunternehmer: true,
    invoiceLogoUrl: null,
    invoiceDisplayPreference: 'NAME',
    invoiceThankYouMessage: null,
    taxValidationStatus: false,
    taxValidatedAt: null,
    taxValidatedBy: null,
    ...overrides
  }
}
```

### Database Mocking

**File:** `apps/web/__tests__/setup.ts`

```typescript
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'
import { PrismaClient } from '@myoflow/db'
import prisma from '@myoflow/db'

jest.mock('@myoflow/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>()
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
```

### NextAuth Mocking

**File:** `apps/web/__tests__/mocks/auth.ts`

```typescript
export const mockSession = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'OWNER'
  },
  expires: '2025-12-31'
}

export const mockAdminSession = {
  ...mockSession,
  user: {
    ...mockSession.user,
    role: 'SUPER_ADMIN'
  }
}
```

## Test Data Management

### Seed Data for Tests

**File:** `packages/db/seed-test.ts`

```typescript
export async function seedTestData() {
  // Create test therapist with various configurations
  const therapists = await Promise.all([
    prisma.therapist.create({
      data: {
        // Therapist with full branding
        invoiceLogoUrl: 'https://via.placeholder.com/800x200',
        invoiceDisplayPreference: 'BOTH',
        invoiceThankYouMessage: 'Thank you!',
        taxValidationStatus: true,
        taxValidatedAt: new Date('2025-09-15'),
        taxValidatedBy: 'Test Advisor'
      }
    }),
    prisma.therapist.create({
      data: {
        // Therapist with defaults
        invoiceDisplayPreference: 'NAME',
        taxValidationStatus: false
      }
    })
  ])

  // Create test invoices
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        therapistId: therapists[0].id,
        status: 'DRAFT',
        totalGrossCents: 10000
      }
    }),
    prisma.invoice.create({
      data: {
        therapistId: therapists[0].id,
        status: 'SENT',
        totalGrossCents: 25000
      }
    })
  ])

  return { therapists, invoices }
}
```

## Manual QA Test Checklist

### Invoice Branding
- [ ] Logo upload accepts PNG/JPG/SVG files
- [ ] Logo upload rejects files >2MB
- [ ] Logo preview displays correctly after upload
- [ ] Display preference selector works for all options
- [ ] Thank you message saves and displays correctly
- [ ] Thank you message enforces 500 char limit
- [ ] Settings persist after page reload

### Revenue Threshold Widget
- [ ] Widget displays on dashboard
- [ ] Revenue amount formats correctly (€ symbol, decimals)
- [ ] Progress bar updates correctly
- [ ] Green/yellow/red color coding works
- [ ] Warning message appears when ≥70%
- [ ] Critical message appears when ≥90%
- [ ] Cache updates after invoice creation

### VAT Rate Warning
- [ ] Warning appears for 10% VAT on massage
- [ ] Warning appears for 13% VAT on massage
- [ ] No warning for 0% or 20% VAT
- [ ] No warning for non-massage services
- [ ] Warning message is clear and helpful

### PDF Generation
- [ ] Logo renders correctly in PDF header
- [ ] Display preferences work (LOGO/NAME/BOTH)
- [ ] Thank you message appears in correct position
- [ ] Draft watermark overlays correctly
- [ ] Validation disclaimer shows when not validated
- [ ] Validation badge shows when validated
- [ ] PDF generation completes in <2 seconds

### Compliance Dashboard
- [ ] Checklist displays all items
- [ ] Readiness score calculates correctly
- [ ] Warnings appear for missing items
- [ ] Validation status banner displays correctly

## Performance Benchmarks

### Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Revenue calculation (no cache) | <100ms | Load testing |
| Revenue calculation (cached) | <10ms | Load testing |
| PDF generation | <2s | Performance profiling |
| Settings page load | <1s | Lighthouse |
| Logo upload | <3s | Manual testing |
| API endpoint response time | <200ms | Load testing |

### Performance Tests

```typescript
// packages/lib/__tests__/performance.test.ts
describe('Performance Benchmarks', () => {
  it('should calculate revenue in <100ms', async () => {
    const start = Date.now()
    await calculateCurrentYearRevenue(prisma, 'therapist-1')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100)
  })

  it('should generate PDF in <2000ms', async () => {
    const start = Date.now()
    await generateInvoicePDF(mockInvoice, mockTherapist)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(2000)
  })
})
```

## CI/CD Integration

### Test Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run integration tests
        run: pnpm test:integration

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Coverage Requirements

**Pre-merge checks:**
- ✅ Overall coverage ≥80%
- ✅ New code coverage ≥90%
- ✅ No regression in existing coverage
- ✅ All critical paths tested

## Test Summary

**Total Test Cases:** 47

**Breakdown:**
- Unit Tests: 22 (47%)
- Integration Tests: 8 (17%)
- E2E Tests: 11 (23%)
- PDF Tests: 8 (17%)
- Manual QA: 25 checklist items

**Estimated Test Execution Time:**
- Unit: ~5 seconds
- Integration: ~15 seconds
- E2E: ~2 minutes
- Total: ~2.5 minutes
