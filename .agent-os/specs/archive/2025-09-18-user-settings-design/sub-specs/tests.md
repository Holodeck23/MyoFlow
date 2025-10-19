# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-09-18-user-settings-design/spec.md

> Created: 2025-09-18
> Version: 1.0.0

## Test Coverage

### Unit Tests (Vitest)

#### Austrian Validation Functions
```typescript
// tests/utils/austrian-validation.test.ts
describe('Austrian Validation Utilities', () => {
  describe('validateAustrianPostalCode', () => {
    test('accepts valid Austrian postal codes', () => {
      expect(validateAustrianPostalCode('1010')).toBe(true) // Vienna
      expect(validateAustrianPostalCode('4020')).toBe(true) // Linz
      expect(validateAustrianPostalCode('9999')).toBe(true) // Edge case
    })

    test('rejects invalid postal codes', () => {
      expect(validateAustrianPostalCode('0123')).toBe(false) // No 0xxx codes
      expect(validateAustrianPostalCode('12345')).toBe(false) // Too long
      expect(validateAustrianPostalCode('123')).toBe(false) // Too short
      expect(validateAustrianPostalCode('abc1')).toBe(false) // Non-numeric
    })
  })

  describe('validateAustrianVATNumber', () => {
    test('accepts valid UID format', () => {
      expect(validateAustrianVATNumber('ATU12345678')).toBe(true)
      expect(validateAustrianVATNumber('ATU99999999')).toBe(true)
    })

    test('rejects invalid UID format', () => {
      expect(validateAustrianVATNumber('AT12345678')).toBe(false) // Missing U
      expect(validateAustrianVATNumber('ATU1234567')).toBe(false) // Too short
      expect(validateAustrianVATNumber('ATU123456789')).toBe(false) // Too long
      expect(validateAustrianVATNumber('ATUabcdefgh')).toBe(false) // Non-numeric
    })
  })

  describe('validateBusinessRegistrationNumber', () => {
    test('accepts valid Firmenbuchnummer format', () => {
      expect(validateBusinessRegistrationNumber('FN 123456a')).toBe(true)
      expect(validateBusinessRegistrationNumber('FN 999999z')).toBe(true)
    })

    test('rejects invalid formats', () => {
      expect(validateBusinessRegistrationNumber('FN123456a')).toBe(false) // Missing space
      expect(validateBusinessRegistrationNumber('FN 12345a')).toBe(false) // Too short
      expect(validateBusinessRegistrationNumber('FN 123456A')).toBe(false) // Uppercase letter
    })
  })
})
```

#### Kleinunternehmer Calculations
```typescript
// tests/utils/tax-calculations.test.ts
describe('Austrian Tax Calculations', () => {
  describe('calculateKleinunternehmerStatus', () => {
    test('determines active status below threshold', () => {
      const result = calculateKleinunternehmerStatus({
        currentYearRevenue: 45000,
        threshold: 55000,
        isActive: true
      })

      expect(result.status).toBe('active')
      expect(result.thresholdPercentage).toBe(81.82)
      expect(result.warningLevel).toBe('warning') // Above 80%
      expect(result.remainingAmount).toBe(10000)
    })

    test('determines exceeded status above threshold', () => {
      const result = calculateKleinunternehmerStatus({
        currentYearRevenue: 60000,
        threshold: 55000,
        isActive: true
      })

      expect(result.status).toBe('exceeded')
      expect(result.thresholdPercentage).toBe(109.09)
      expect(result.warningLevel).toBe('exceeded')
      expect(result.excessAmount).toBe(5000)
    })

    test('calculates warning levels correctly', () => {
      const safeLevel = calculateKleinunternehmerStatus({
        currentYearRevenue: 30000,
        threshold: 55000,
        isActive: true
      })
      expect(safeLevel.warningLevel).toBe('safe')

      const warningLevel = calculateKleinunternehmerStatus({
        currentYearRevenue: 50000,
        threshold: 55000,
        isActive: true
      })
      expect(warningLevel.warningLevel).toBe('warning')

      const criticalLevel = calculateKleinunternehmerStatus({
        currentYearRevenue: 54000,
        threshold: 55000,
        isActive: true
      })
      expect(criticalLevel.warningLevel).toBe('critical')
    })
  })

  describe('calculateVAT', () => {
    test('calculates standard VAT rate', () => {
      const result = calculateVAT(100, 20, false) // 20% VAT not included
      expect(result.netAmount).toBe(100)
      expect(result.vatAmount).toBe(20)
      expect(result.grossAmount).toBe(120)
    })

    test('handles VAT included pricing', () => {
      const result = calculateVAT(120, 20, true) // 20% VAT included
      expect(result.netAmount).toBe(100)
      expect(result.vatAmount).toBe(20)
      expect(result.grossAmount).toBe(120)
    })

    test('handles Kleinunternehmer exemption', () => {
      const result = calculateVAT(100, 0, false) // Kleinunternehmer
      expect(result.netAmount).toBe(100)
      expect(result.vatAmount).toBe(0)
      expect(result.grossAmount).toBe(100)
    })
  })
})
```

#### Travel Calculations
```typescript
// tests/utils/travel-calculations.test.ts
describe('Travel Calculations', () => {
  describe('calculateTravelCost', () => {
    test('calculates cost using standard Austrian rates', () => {
      const cost = calculateTravelCost(10, 'car') // 10km by car
      expect(cost).toBe(4.20) // €0.42/km standard rate
    })

    test('applies minimum travel charge', () => {
      const cost = calculateTravelCost(1, 'car', { minimumCharge: 5.00 })
      expect(cost).toBe(5.00) // Minimum charge applies
    })

    test('handles different transport methods', () => {
      expect(calculateTravelCost(10, 'bicycle')).toBe(3.80) // €0.38/km
      expect(calculateTravelCost(10, 'public_transport')).toBe(2.50) // Flat rate
      expect(calculateTravelCost(10, 'walking')).toBe(0) // No cost
    })
  })

  describe('calculateTravelTime', () => {
    test('estimates travel time by transport method', () => {
      expect(calculateTravelTime(10, 'car')).toBe(12) // ~50km/h average
      expect(calculateTravelTime(10, 'bicycle')).toBe(40) // ~15km/h
      expect(calculateTravelTime(10, 'walking')).toBe(120) // ~5km/h
    })

    test('includes buffer time when specified', () => {
      const timeWithBuffer = calculateTravelTime(10, 'car', { bufferMinutes: 15 })
      expect(timeWithBuffer).toBe(27) // 12 + 15 buffer
    })
  })

  describe('isWithinServiceRadius', () => {
    test('validates addresses within service radius', () => {
      const baseLocation = { lat: 48.3069, lng: 14.2858 } // Linz
      const clientLocation = { lat: 48.2684, lng: 14.3208 } // Leonding (~8km)

      expect(isWithinServiceRadius(clientLocation, baseLocation, 20)).toBe(true)
      expect(isWithinServiceRadius(clientLocation, baseLocation, 5)).toBe(false)
    })
  })
})
```

#### Profile Completion Calculation
```typescript
// tests/utils/profile-completion.test.ts
describe('Profile Completion Calculator', () => {
  test('calculates completion score accurately', () => {
    const profile = {
      email: 'test@example.com',
      phone: '+43 123 456 789',
      firstName: 'Dr.',
      lastName: 'Test',
      businessAddress: 'Hauptstraße 1',
      businessCity: 'Linz',
      businessPostalCode: '4020',
      bio: 'Professional therapist'
    }

    const score = calculateProfileCompletion(profile)
    expect(score).toBe(100) // All fields present
  })

  test('handles partial profile completion', () => {
    const partialProfile = {
      email: 'test@example.com',
      firstName: 'Dr.',
      lastName: 'Test'
    }

    const score = calculateProfileCompletion(partialProfile)
    expect(score).toBe(40) // 10 + 20 + 10 = 40%
  })

  test('identifies missing fields correctly', () => {
    const profile = { email: 'test@example.com' }
    const missing = getMissingProfileFields(profile)

    expect(missing).toContain({
      category: 'contact',
      item: 'phone',
      priority: 'high'
    })
    expect(missing).toContain({
      category: 'personal',
      item: 'name',
      priority: 'high'
    })
  })
})
```

### Integration Tests

#### Settings API Endpoints
```typescript
// tests/api/settings/profile.test.ts
describe('/api/settings/profile', () => {
  let testTherapist: Therapist
  let authCookies: string

  beforeEach(async () => {
    testTherapist = await createTestTherapist()
    authCookies = await authenticateTestUser(testTherapist.email)
  })

  describe('GET /api/settings/profile', () => {
    test('returns complete profile data for authenticated user', async () => {
      const response = await fetch('/api/settings/profile', {
        headers: { Cookie: authCookies }
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toHaveProperty('businessInfo')
      expect(data).toHaveProperty('personalInfo')
      expect(data).toHaveProperty('businessAddress')
      expect(data.personalInfo.email).toBe(testTherapist.email)
    })

    test('returns 401 for unauthenticated requests', async () => {
      const response = await fetch('/api/settings/profile')
      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/settings/profile', () => {
    test('updates profile successfully with valid data', async () => {
      const updateData = {
        businessInfo: {
          businessName: 'Updated Practice Name',
          businessType: 'sole_proprietorship'
        },
        businessAddress: {
          addressLine1: 'Neue Straße 123',
          city: 'Linz',
          postalCode: '4020'
        }
      }

      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookies
        },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)

      // Verify update in database
      const updatedTherapist = await db.therapist.findUnique({
        where: { id: testTherapist.id }
      })
      expect(updatedTherapist?.businessName).toBe('Updated Practice Name')
    })

    test('validates Austrian postal codes', async () => {
      const invalidData = {
        businessAddress: {
          postalCode: '0123' // Invalid Austrian postal code
        }
      }

      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookies
        },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.details).toContainEqual({
        field: 'businessAddress.postalCode',
        message: 'Invalid Austrian postal code format'
      })
    })

    test('validates VAT number format', async () => {
      const invalidData = {
        businessInfo: {
          vatNumber: 'INVALID_VAT'
        }
      }

      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookies
        },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })
  })
})
```

#### Tax Compliance API
```typescript
// tests/api/settings/tax-compliance.test.ts
describe('/api/settings/tax-compliance', () => {
  let testTherapist: Therapist
  let authCookies: string

  beforeEach(async () => {
    testTherapist = await createTestTherapist()
    authCookies = await authenticateTestUser(testTherapist.email)

    // Create initial tax settings
    await db.taxComplianceSettings.create({
      data: {
        therapistId: testTherapist.id,
        kleinunternehmerThreshold: 55000,
        currentYearRevenue: 35000
      }
    })
  })

  describe('GET /api/settings/tax-compliance', () => {
    test('returns current tax compliance status', async () => {
      const response = await fetch('/api/settings/tax-compliance', {
        headers: { Cookie: authCookies }
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.kleinunternehmer.currentYearRevenue).toBe(35000)
      expect(data.kleinunternehmer.thresholdPercentage).toBeCloseTo(63.64)
      expect(data.kleinunternehmer.warningLevel).toBe('safe')
    })

    test('calculates revenue from actual invoices', async () => {
      // Create test invoices totaling €40,000
      await createTestInvoices(testTherapist.id, [
        { amount: 25000, status: 'PAID' },
        { amount: 15000, status: 'SENT' },
        { amount: 5000, status: 'DRAFT' } // Should not count
      ])

      const response = await fetch('/api/settings/tax-compliance', {
        headers: { Cookie: authCookies }
      })

      const data = await response.json()
      expect(data.kleinunternehmer.currentYearRevenue).toBe(40000)
    })
  })

  describe('PUT /api/settings/tax-compliance', () => {
    test('switches from Kleinunternehmer to VAT registration', async () => {
      const updateData = {
        vatRegistration: {
          isRegistered: true,
          vatNumber: 'ATU12345678',
          returnFrequency: 'quarterly'
        },
        kleinunternehmer: {
          isActive: false
        }
      }

      const response = await fetch('/api/settings/tax-compliance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookies
        },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)

      // Verify changes in database
      const updatedSettings = await db.taxComplianceSettings.findUnique({
        where: { therapistId: testTherapist.id }
      })
      expect(updatedSettings?.vatRegistrationDate).toBeTruthy()
    })

    test('triggers threshold breach alert', async () => {
      const updateData = {
        kleinunternehmer: {
          threshold: 30000 // Lower than current revenue
        }
      }

      const response = await fetch('/api/settings/tax-compliance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookies
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()
      expect(data.impact.requiresAlert).toBe(true)
      expect(data.impact.alertType).toBe('threshold_breach')
    })
  })
})
```

### E2E Tests (Playwright)

#### Complete Settings Workflow
```typescript
// tests/e2e/settings-workflow.spec.ts
test.describe('Settings Management Workflow', () => {
  test('complete settings configuration journey', async ({ page }) => {
    // Login as test therapist
    await loginAsTestTherapist(page)

    // Navigate to settings
    await page.goto('/dashboard/settings')
    await expect(page.locator('h1')).toContainText('Einstellungen')

    // Check profile completion indicator
    const completionScore = await page.locator('[data-testid="profile-completion-score"]')
    await expect(completionScore).toBeVisible()

    // Configure professional profile
    await page.click('[data-testid="profile-tab"]')
    await page.fill('input[name="businessName"]', 'Dr. Test Praxis')
    await page.fill('input[name="businessAddress.addressLine1"]', 'Teststraße 123')
    await page.fill('input[name="businessAddress.postalCode"]', '4020')
    await page.fill('input[name="businessAddress.city"]', 'Linz')
    await page.click('button[type="submit"]')

    // Wait for success notification
    await expect(page.locator('.toast-success')).toBeVisible()

    // Configure tax compliance
    await page.click('[data-testid="tax-compliance-tab"]')
    await page.check('input[name="kleinunternehmerStatus"]')
    await page.fill('input[name="taxAdvisor.firmName"]', 'Steuerberatung Test')
    await page.click('button[type="submit"]')

    // Configure travel settings
    await page.click('[data-testid="travel-tab"]')
    await page.selectOption('select[name="transportMethod"]', 'car')
    await page.fill('input[name="ratePerKm"]', '0.42')
    await page.fill('input[name="serviceRadius"]', '25')
    await page.click('button[type="submit"]')

    // Create service rate template
    await page.click('[data-testid="service-rates-tab"]')
    await page.click('button[data-testid="add-service-rate"]')
    await page.fill('input[name="serviceName"]', 'Klassische Massage')
    await page.selectOption('select[name="serviceCategory"]', 'massage')
    await page.fill('input[name="basePrice"]', '80')
    await page.fill('input[name="defaultDurationMinutes"]', '60')
    await page.click('button[type="submit"]')

    // Verify completion score increased
    const updatedScore = await page.locator('[data-testid="profile-completion-score"]')
    const scoreText = await updatedScore.textContent()
    expect(parseInt(scoreText || '0')).toBeGreaterThan(50)

    // Test export configuration
    await page.click('[data-testid="export-tab"]')
    await page.click('button[data-testid="create-export-config"]')
    await page.selectOption('select[name="targetSystem"]', 'BMD_NTCS')
    await page.fill('input[name="configurationName"]', 'Monthly BMD Export')
    await page.click('button[type="submit"]')

    // Test export functionality
    await page.click('button[data-testid="test-export"]')
    await expect(page.locator('[data-testid="export-preview"]')).toBeVisible()
  })

  test('validates Austrian compliance requirements', async ({ page }) => {
    await loginAsTestTherapist(page)
    await page.goto('/dashboard/settings?tab=tax-compliance')

    // Test invalid VAT number
    await page.fill('input[name="vatNumber"]', 'INVALID')
    await page.click('button[type="submit"]')
    await expect(page.locator('.error-message')).toContainText('Ungültiges UID-Format')

    // Test valid VAT number
    await page.fill('input[name="vatNumber"]', 'ATU12345678')
    await page.click('button[type="submit"]')
    await expect(page.locator('.toast-success')).toBeVisible()

    // Test threshold warning
    await page.fill('input[name="currentYearRevenue"]', '50000')
    await page.blur('input[name="currentYearRevenue"]')
    await expect(page.locator('[data-testid="threshold-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="threshold-warning"]')).toContainText('nähern sich der Grenze')
  })

  test('mobile responsive settings interface', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await loginAsTestTherapist(page)
    await page.goto('/dashboard/settings')

    // Mobile navigation should be dropdown
    await expect(page.locator('[data-testid="mobile-settings-dropdown"]')).toBeVisible()
    await expect(page.locator('[data-testid="desktop-settings-tabs"]')).not.toBeVisible()

    // Test tab switching on mobile
    await page.selectOption('[data-testid="mobile-settings-dropdown"]', 'travel')
    await expect(page.locator('[data-testid="travel-settings"]')).toBeVisible()

    // Forms should be stacked vertically
    const form = page.locator('[data-testid="travel-form"]')
    await expect(form).toHaveCSS('flex-direction', 'column')
  })
})
```

#### Austrian Geographic Integration
```typescript
// tests/e2e/geographic-features.spec.ts
test.describe('Austrian Geographic Integration', () => {
  test('configures travel settings with Austrian addresses', async ({ page }) => {
    await loginAsTestTherapist(page)
    await page.goto('/dashboard/settings?tab=travel')

    // Enter Austrian address
    await page.fill('input[name="baseAddress"]', 'Hauptplatz 1, 4020 Linz')
    await page.blur('input[name="baseAddress"]')

    // Wait for geocoding
    await expect(page.locator('[data-testid="coordinates-display"]')).toBeVisible()
    await expect(page.locator('[data-testid="coordinates-display"]')).toContainText('48.3')

    // Set service radius
    await page.fill('input[name="serviceRadius"]', '30')
    await page.blur('input[name="serviceRadius"]')

    // Map should update with service area
    await expect(page.locator('[data-testid="service-radius-map"]')).toBeVisible()
    await expect(page.locator('[data-testid="radius-circle"]')).toBeVisible()

    // Test postal code validation
    await page.fill('input[name="basePostalCode"]', '0123') // Invalid
    await expect(page.locator('.error-message')).toContainText('Ungültige Postleitzahl')

    await page.fill('input[name="basePostalCode"]', '4020') // Valid
    await expect(page.locator('.error-message')).not.toBeVisible()
  })

  test('calculates realistic Austrian travel costs', async ({ page }) => {
    await loginAsTestTherapist(page)
    await page.goto('/dashboard/settings?tab=travel')

    // Configure for car travel
    await page.selectOption('select[name="transportMethod"]', 'car')
    await page.fill('input[name="ratePerKm"]', '0.42')
    await page.fill('input[name="minimumTravelCharge"]', '5.00')

    // Test travel calculation
    await page.click('[data-testid="test-travel-calculation"]')
    await page.fill('input[name="testDestination"]', 'Leonding, Austria')
    await page.click('button[data-testid="calculate-travel"]')

    // Should show realistic distance and cost for Linz -> Leonding
    await expect(page.locator('[data-testid="calculated-distance"]')).toContainText('8.5 km')
    await expect(page.locator('[data-testid="calculated-cost"]')).toContainText('€3.57')
    await expect(page.locator('[data-testid="calculated-time"]')).toContainText('15 min')
  })
})
```

## Mocking Requirements

### External API Mocking

#### Google Maps API Mock
```typescript
// tests/mocks/google-maps.mock.ts
export const mockGoogleMapsResponses = {
  geocode: {
    linz: {
      data: {
        results: [{
          geometry: {
            location: { lat: 48.3069, lng: 14.2858 }
          },
          formatted_address: 'Hauptplatz 1, 4020 Linz, Austria'
        }]
      }
    },
    leonding: {
      data: {
        results: [{
          geometry: {
            location: { lat: 48.2684, lng: 14.3208 }
          },
          formatted_address: 'Stadtplatz 1, 4040 Leonding, Austria'
        }]
      }
    }
  },
  distanceMatrix: {
    linzToLeonding: {
      data: {
        rows: [{
          elements: [{
            status: 'OK',
            distance: { value: 8500, text: '8.5 km' },
            duration: { value: 900, text: '15 mins' }
          }]
        }]
      }
    }
  }
}

// Mock implementation
vi.mock('@googlemaps/google-maps-services-js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    geocode: vi.fn().mockImplementation(({ params }) => {
      if (params.address.includes('Linz')) {
        return Promise.resolve(mockGoogleMapsResponses.geocode.linz)
      }
      if (params.address.includes('Leonding')) {
        return Promise.resolve(mockGoogleMapsResponses.geocode.leonding)
      }
      return Promise.reject(new Error('Address not found'))
    }),
    distancematrix: vi.fn().mockResolvedValue(
      mockGoogleMapsResponses.distanceMatrix.linzToLeonding
    )
  }))
}))
```

#### Austrian Tax Authority Mock
```typescript
// tests/mocks/austrian-tax-authority.mock.ts
export const mockBMFValidation = {
  validVATNumbers: ['ATU12345678', 'ATU87654321', 'ATU99999999'],
  invalidVATNumbers: ['ATU00000000', 'ATU11111111'],

  validateVATNumber: vi.fn().mockImplementation((vatNumber: string) => {
    if (mockBMFValidation.validVATNumbers.includes(vatNumber)) {
      return Promise.resolve({
        valid: true,
        companyName: 'Test Therapie GmbH',
        address: 'Teststraße 123, 4020 Linz'
      })
    }
    if (mockBMFValidation.invalidVATNumbers.includes(vatNumber)) {
      return Promise.resolve({
        valid: false,
        error: 'UID-Nummer nicht registriert'
      })
    }
    return Promise.resolve({
      valid: true,
      companyName: 'Mock Company'
    })
  })
}
```

### Database Mocking

#### Test Data Factory
```typescript
// tests/factories/test-data.factory.ts
export class TestDataFactory {
  static createTestTherapist(overrides: Partial<Therapist> = {}): Therapist {
    return {
      id: 'test-therapist-id',
      email: 'test@example.com',
      firstName: 'Dr.',
      lastName: 'Test',
      businessName: 'Test Therapie Praxis',
      businessAddress: 'Teststraße 123',
      businessCity: 'Linz',
      businessPostalCode: '4020',
      kleinunternehmerStatus: true,
      vatRegistered: false,
      profileCompletionScore: 75,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  static createTestTravelSettings(therapistId: string): TravelSettings {
    return {
      id: 'test-travel-settings-id',
      therapistId,
      baseAddressLine1: 'Hauptplatz 1',
      baseCity: 'Linz',
      basePostalCode: '4020',
      baseCoordinates: 'POINT(14.2858 48.3069)',
      transportMethod: 'car',
      ratePerKm: 0.42,
      minimumTravelCharge: 5.00,
      maximumTravelDistance: 25,
      serviceRadiusKm: 20,
      travelBufferMinutes: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  static createTestServiceRate(therapistId: string, overrides: Partial<ServiceRateTemplate> = {}): ServiceRateTemplate {
    return {
      id: 'test-service-rate-id',
      therapistId,
      serviceName: 'Klassische Massage',
      serviceCategory: 'massage',
      basePrice: 80.00,
      currency: 'EUR',
      defaultDurationMinutes: 60,
      vatRate: 20.00,
      vatIncluded: true,
      kleinunternehmerExempt: false,
      homeVisitAvailable: true,
      travelIncluded: false,
      travelSurcharge: 0.00,
      publicBookingEnabled: true,
      active: true,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  static createTestTaxSettings(therapistId: string): TaxComplianceSettings {
    return {
      id: 'test-tax-settings-id',
      therapistId,
      kleinunternehmerThreshold: 55000,
      currentYearRevenue: 35000,
      defaultVatRate: 20.00,
      reducedVatRate: 10.00,
      exemptVatRate: 0.00,
      complianceStatus: 'compliant',
      lastComplianceCheck: new Date(),
      thresholdAlertPercentage: 80,
      quarterlyReviewReminder: true,
      annualTaxReturnReminder: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
}
```

#### Database Test Utilities
```typescript
// tests/utils/database-test-utils.ts
export class DatabaseTestUtils {
  static async seedTestData(therapistId: string) {
    await db.$transaction(async (tx) => {
      // Create test therapist
      await tx.therapist.upsert({
        where: { id: therapistId },
        create: TestDataFactory.createTestTherapist({ id: therapistId }),
        update: {}
      })

      // Create travel settings
      await tx.travelSettings.upsert({
        where: { therapistId },
        create: TestDataFactory.createTestTravelSettings(therapistId),
        update: {}
      })

      // Create service rates
      const serviceRates = [
        TestDataFactory.createTestServiceRate(therapistId, {
          serviceName: 'Klassische Massage',
          basePrice: 80.00,
          defaultDurationMinutes: 60
        }),
        TestDataFactory.createTestServiceRate(therapistId, {
          serviceName: 'Triggerpunkt-Therapie',
          basePrice: 90.00,
          defaultDurationMinutes: 45
        })
      ]

      for (const rate of serviceRates) {
        await tx.serviceRateTemplates.create({ data: rate })
      }

      // Create tax compliance settings
      await tx.taxComplianceSettings.upsert({
        where: { therapistId },
        create: TestDataFactory.createTestTaxSettings(therapistId),
        update: {}
      })
    })
  }

  static async cleanupTestData(therapistId: string) {
    await db.$transaction(async (tx) => {
      await tx.exportConfigurations.deleteMany({ where: { therapistId } })
      await tx.serviceRateTemplates.deleteMany({ where: { therapistId } })
      await tx.therapistCredentials.deleteMany({ where: { therapistId } })
      await tx.taxComplianceSettings.deleteMany({ where: { therapistId } })
      await tx.travelSettings.deleteMany({ where: { therapistId } })
      await tx.therapist.delete({ where: { id: therapistId } })
    })
  }

  static async createTestInvoices(therapistId: string, invoices: { amount: number; status: string }[]) {
    const client = await db.client.create({
      data: {
        therapistId,
        firstName: 'Test',
        lastName: 'Client',
        email: 'client@test.com'
      }
    })

    for (const invoice of invoices) {
      await db.invoice.create({
        data: {
          therapistId,
          clientId: client.id,
          invoiceNumber: `TEST-${Date.now()}`,
          amount: invoice.amount,
          status: invoice.status,
          issueDate: new Date(),
          currency: 'EUR'
        }
      })
    }
  }
}
```

### Performance Testing

#### Load Testing for Settings API
```typescript
// tests/performance/settings-load.test.ts
describe('Settings API Performance', () => {
  test('handles concurrent profile updates', async () => {
    const therapistId = 'test-therapist'
    await DatabaseTestUtils.seedTestData(therapistId)

    const updatePromises = Array.from({ length: 10 }, (_, i) =>
      fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getTestToken(therapistId)}`
        },
        body: JSON.stringify({
          businessInfo: { businessName: `Updated Practice ${i}` }
        })
      })
    )

    const startTime = Date.now()
    const responses = await Promise.all(updatePromises)
    const endTime = Date.now()

    // All requests should succeed
    expect(responses.every(r => r.ok)).toBe(true)

    // Should complete within reasonable time
    expect(endTime - startTime).toBeLessThan(5000) // 5 seconds

    // Final state should be consistent
    const finalProfile = await db.therapist.findUnique({
      where: { id: therapistId }
    })
    expect(finalProfile?.businessName).toContain('Updated Practice')
  })

  test('geographic calculations performance', async () => {
    const calculations = Array.from({ length: 100 }, () => ({
      from: { lat: 48.3069, lng: 14.2858 }, // Linz
      to: {
        lat: 48.3069 + (Math.random() - 0.5) * 0.1,
        lng: 14.2858 + (Math.random() - 0.5) * 0.1
      }
    }))

    const startTime = Date.now()
    const results = await Promise.all(
      calculations.map(calc => calculateTravelDistance(calc.from, calc.to, 'car'))
    )
    const endTime = Date.now()

    expect(results).toHaveLength(100)
    expect(results.every(r => r.distance > 0)).toBe(true)
    expect(endTime - startTime).toBeLessThan(2000) // 2 seconds for 100 calculations
  })
})