import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Invoice Branding Settings Database Integration', () => {
  let testUserId: string
  let testTherapistId: string

  beforeEach(async () => {
    // Generate unique email for each test
    const uniqueEmail = `invoice-branding-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
    const uniqueSlug = `invoice-branding-therapist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create test user and therapist
    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Invoice Branding Test User',
      },
    })
    testUserId = user.id

    const therapist = await prisma.therapist.create({
      data: {
        userId: testUserId,
        slug: uniqueSlug,
        designation: 'HEILMASSEUR',
        vatStatus: 'KLEINUNTERNEHMER',
        kleinunternehmer: true,
      },
    })
    testTherapistId = therapist.id
  })

  afterEach(async () => {
    // Clean up test data in correct order to handle foreign key constraints
    await prisma.therapist.deleteMany({ where: { id: testTherapistId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
  })

  describe('Invoice Logo Settings', () => {
    it('should store invoice logo URL', async () => {
      const logoUrl = 'https://example.com/logo.png'

      const updated = await prisma.therapist.update({
        where: { id: testTherapistId },
        data: {
          invoiceLogoUrl: logoUrl,
        },
      })

      expect(updated.invoiceLogoUrl).toBe(logoUrl)
    })

    it('should allow null invoice logo URL', async () => {
      const therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })

      expect(therapist?.invoiceLogoUrl).toBeNull()
    })

    it('should update logo URL from null to value', async () => {
      // Initially null
      let therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })
      expect(therapist?.invoiceLogoUrl).toBeNull()

      // Update to value
      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceLogoUrl: 'https://cdn.example.com/therapist-logo.jpg' },
      })

      // Verify update
      therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })
      expect(therapist?.invoiceLogoUrl).toBe('https://cdn.example.com/therapist-logo.jpg')
    })

    it('should clear logo URL by setting to null', async () => {
      // Set initial value
      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceLogoUrl: 'https://example.com/logo.png' },
      })

      // Clear it
      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceLogoUrl: null },
      })

      const therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })
      expect(therapist?.invoiceLogoUrl).toBeNull()
    })
  })

  describe('Invoice Display Preference', () => {
    it('should default to NAME when not specified', async () => {
      const therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })

      expect(therapist?.invoiceDisplayPreference).toBe('NAME')
    })

    it('should accept LOGO display preference', async () => {
      const updated = await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceDisplayPreference: 'LOGO' },
      })

      expect(updated.invoiceDisplayPreference).toBe('LOGO')
    })

    it('should accept BOTH display preference', async () => {
      const updated = await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceDisplayPreference: 'BOTH' },
      })

      expect(updated.invoiceDisplayPreference).toBe('BOTH')
    })

    it('should switch between display preferences', async () => {
      // Start with NAME (default)
      let therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })
      expect(therapist?.invoiceDisplayPreference).toBe('NAME')

      // Change to LOGO
      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceDisplayPreference: 'LOGO' },
      })

      therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })
      expect(therapist?.invoiceDisplayPreference).toBe('LOGO')

      // Change to BOTH
      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceDisplayPreference: 'BOTH' },
      })

      therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })
      expect(therapist?.invoiceDisplayPreference).toBe('BOTH')
    })
  })

  describe('Invoice Thank You Message', () => {
    it('should store custom thank you message', async () => {
      const message = 'Vielen Dank für Ihr Vertrauen! Wir freuen uns auf Ihren nächsten Besuch.'

      const updated = await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceThankYouMessage: message },
      })

      expect(updated.invoiceThankYouMessage).toBe(message)
    })

    it('should allow null thank you message', async () => {
      const therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })

      expect(therapist?.invoiceThankYouMessage).toBeNull()
    })

    it('should handle multi-line thank you messages', async () => {
      const multiLineMessage = `Herzlichen Dank für Ihren Besuch!

Wir hoffen, Sie hatten eine entspannende Behandlung.

Mit freundlichen Grüßen,
Ihr Praxis-Team`

      const updated = await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceThankYouMessage: multiLineMessage },
      })

      expect(updated.invoiceThankYouMessage).toBe(multiLineMessage)
    })

    it('should update thank you message', async () => {
      const message1 = 'Danke für Ihren Besuch!'
      const message2 = 'Vielen Dank und bis bald!'

      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceThankYouMessage: message1 },
      })

      let therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })
      expect(therapist?.invoiceThankYouMessage).toBe(message1)

      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { invoiceThankYouMessage: message2 },
      })

      therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })
      expect(therapist?.invoiceThankYouMessage).toBe(message2)
    })
  })

  describe('Tax Validation Status', () => {
    it('should default to false when not specified', async () => {
      const therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })

      expect(therapist?.taxValidationCompleted).toBe(false)
    })

    it('should mark tax validation as completed', async () => {
      const updated = await prisma.therapist.update({
        where: { id: testTherapistId },
        data: { taxValidationCompleted: true },
      })

      expect(updated.taxValidationCompleted).toBe(true)
    })

    it('should record tax validation timestamp', async () => {
      const validationDate = new Date('2025-10-05T10:00:00.000Z')

      const updated = await prisma.therapist.update({
        where: { id: testTherapistId },
        data: {
          taxValidationCompleted: true,
          taxValidatedAt: validationDate,
        },
      })

      expect(updated.taxValidationCompleted).toBe(true)
      expect(updated.taxValidatedAt).toEqual(validationDate)
    })

    it('should allow clearing validation status', async () => {
      // Set validation
      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: {
          taxValidationCompleted: true,
          taxValidatedAt: new Date(),
        },
      })

      // Clear validation
      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: {
          taxValidationCompleted: false,
          taxValidatedAt: null,
        },
      })

      const therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })

      expect(therapist?.taxValidationCompleted).toBe(false)
      expect(therapist?.taxValidatedAt).toBeNull()
    })
  })

  describe('Combined Branding Settings', () => {
    it('should update all invoice branding fields together', async () => {
      const brandingData = {
        invoiceLogoUrl: 'https://cdn.example.com/logo.png',
        invoiceDisplayPreference: 'BOTH' as const,
        invoiceThankYouMessage: 'Vielen Dank für Ihr Vertrauen!',
        brandColor: '#0066cc',
      }

      const updated = await prisma.therapist.update({
        where: { id: testTherapistId },
        data: brandingData,
      })

      expect(updated.invoiceLogoUrl).toBe(brandingData.invoiceLogoUrl)
      expect(updated.invoiceDisplayPreference).toBe(brandingData.invoiceDisplayPreference)
      expect(updated.invoiceThankYouMessage).toBe(brandingData.invoiceThankYouMessage)
      expect(updated.brandColor).toBe(brandingData.brandColor)
    })

    it('should retrieve complete branding configuration', async () => {
      await prisma.therapist.update({
        where: { id: testTherapistId },
        data: {
          invoiceLogoUrl: 'https://example.com/brand.svg',
          invoiceDisplayPreference: 'LOGO',
          invoiceThankYouMessage: 'Danke!',
          brandColor: '#ff6600',
          taxValidationCompleted: true,
          taxValidatedAt: new Date('2025-10-05T12:00:00.000Z'),
        },
      })

      const therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
        select: {
          id: true,
          invoiceLogoUrl: true,
          invoiceDisplayPreference: true,
          invoiceThankYouMessage: true,
          brandColor: true,
          taxValidationCompleted: true,
          taxValidatedAt: true,
        },
      })

      expect(therapist).toMatchObject({
        id: testTherapistId,
        invoiceLogoUrl: 'https://example.com/brand.svg',
        invoiceDisplayPreference: 'LOGO',
        invoiceThankYouMessage: 'Danke!',
        brandColor: '#ff6600',
        taxValidationCompleted: true,
      })
      expect(therapist?.taxValidatedAt).toBeInstanceOf(Date)
    })
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
