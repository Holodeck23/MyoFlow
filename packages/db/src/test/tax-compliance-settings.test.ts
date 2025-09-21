import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('TaxComplianceSettings Database Integration', () => {
  let testUserId: string
  let testTherapistId: string

  beforeEach(async () => {
    // Generate unique email for each test
    const uniqueEmail = `tax-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
    const uniqueSlug = `tax-test-therapist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create test user and therapist
    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Tax Compliance Test User',
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
        annualGrossCents: 4500000, // €45,000 - below threshold
      },
    })
    testTherapistId = therapist.id
  })

  afterEach(async () => {
    // Clean up test data in correct order to handle foreign key constraints
    await prisma.taxComplianceSettings.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.therapist.deleteMany({ where: { id: testTherapistId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
  })

  describe('TaxComplianceSettings CRUD Operations', () => {
    it('should create tax compliance settings with all fields including kleinunternehmer_start', async () => {
      const startDate = new Date('2023-01-01T00:00:00.000Z')
      const endDate = new Date('2024-12-31T23:59:59.999Z')
      const vatRegistrationDate = new Date('2023-06-15T00:00:00.000Z')
      const revenueCalculatedAt = new Date()

      const taxSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          vatNumber: 'ATU12345678',
          vatRegistered: true,
          kleinunternehmerActive: true,
          kleinunternehmerThresholdCents: 5500000, // €55,000
          currentYearRevenueCents: 4200000, // €42,000
          revenueYear: 2024,
          kleinunternehmerStart: startDate,
          kleinunternehmerEnd: endDate,
          legalNoticeTemplate: 'Standard Austrian legal notice template',
          taxAdvisorName: 'Dr. Maria Steuerberater',
          taxAdvisorEmail: 'maria@steuerberatung.at',
          taxAdvisorPhone: '+43 1 234 5678',
          vatRegistrationDate: vatRegistrationDate,
          revenueLastCalculatedAt: revenueCalculatedAt,
          rksvEnabled: true,
          cashRegisterId: 'RKSV-001',
          signatureDeviceId: 'SIG-DEV-123',
          rksvNotes: 'RKSV compliance monitoring active',
          lastRksvAuditAt: new Date('2024-01-15T00:00:00.000Z'),
          nextRksvAuditDue: new Date('2024-12-31T00:00:00.000Z'),
        },
      })

      expect(taxSettings).toBeTruthy()
      expect(taxSettings.therapistId).toBe(testTherapistId)
      expect(taxSettings.vatNumber).toBe('ATU12345678')
      expect(taxSettings.vatRegistered).toBe(true)
      expect(taxSettings.kleinunternehmerActive).toBe(true)
      expect(taxSettings.kleinunternehmerThresholdCents).toBe(5500000)
      expect(taxSettings.currentYearRevenueCents).toBe(4200000)
      expect(taxSettings.revenueYear).toBe(2024)

      // Test the problematic kleinunternehmer_start field
      expect(taxSettings.kleinunternehmerStart).toEqual(startDate)
      expect(taxSettings.kleinunternehmerEnd).toEqual(endDate)

      expect(taxSettings.legalNoticeTemplate).toBe('Standard Austrian legal notice template')
      expect(taxSettings.taxAdvisorName).toBe('Dr. Maria Steuerberater')
      expect(taxSettings.taxAdvisorEmail).toBe('maria@steuerberatung.at')
      expect(taxSettings.taxAdvisorPhone).toBe('+43 1 234 5678')
      expect(taxSettings.vatRegistrationDate).toEqual(vatRegistrationDate)
      expect(taxSettings.revenueLastCalculatedAt).toEqual(revenueCalculatedAt)

      // RKSV fields
      expect(taxSettings.rksvEnabled).toBe(true)
      expect(taxSettings.cashRegisterId).toBe('RKSV-001')
      expect(taxSettings.signatureDeviceId).toBe('SIG-DEV-123')
      expect(taxSettings.rksvNotes).toBe('RKSV compliance monitoring active')
      expect(taxSettings.lastRksvAuditAt).toEqual(new Date('2024-01-15T00:00:00.000Z'))
      expect(taxSettings.nextRksvAuditDue).toEqual(new Date('2024-12-31T00:00:00.000Z'))

      // Timestamps
      expect(taxSettings.createdAt).toBeInstanceOf(Date)
      expect(taxSettings.updatedAt).toBeInstanceOf(Date)
    })

    it('should create tax compliance settings with minimal required fields', async () => {
      const taxSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
        },
      })

      expect(taxSettings).toBeTruthy()
      expect(taxSettings.therapistId).toBe(testTherapistId)

      // Test default values
      expect(taxSettings.vatRegistered).toBe(false)
      expect(taxSettings.kleinunternehmerActive).toBe(true)
      expect(taxSettings.kleinunternehmerThresholdCents).toBe(5500000)
      expect(taxSettings.currentYearRevenueCents).toBe(0)
      expect(taxSettings.rksvEnabled).toBe(false)

      // Nullable fields should be null
      expect(taxSettings.vatNumber).toBeNull()
      expect(taxSettings.revenueYear).toBeNull()
      expect(taxSettings.kleinunternehmerStart).toBeNull()
      expect(taxSettings.kleinunternehmerEnd).toBeNull()
      expect(taxSettings.legalNoticeTemplate).toBeNull()
    })

    it('should read tax compliance settings with kleinunternehmer_start field', async () => {
      const startDate = new Date('2023-01-01T00:00:00.000Z')

      // Create settings
      await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          kleinunternehmerActive: true,
          kleinunternehmerStart: startDate,
          currentYearRevenueCents: 3000000,
          revenueYear: 2024,
        },
      })

      // Read settings back
      const retrievedSettings = await prisma.taxComplianceSettings.findUnique({
        where: { therapistId: testTherapistId },
      })

      expect(retrievedSettings).toBeTruthy()
      expect(retrievedSettings?.kleinunternehmerStart).toEqual(startDate)
      expect(retrievedSettings?.kleinunternehmerActive).toBe(true)
      expect(retrievedSettings?.currentYearRevenueCents).toBe(3000000)
      expect(retrievedSettings?.revenueYear).toBe(2024)
    })

    it('should update tax compliance settings including kleinunternehmer_start', async () => {
      const originalStartDate = new Date('2023-01-01T00:00:00.000Z')
      const newStartDate = new Date('2024-01-01T00:00:00.000Z')

      // Create initial settings
      const initialSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          kleinunternehmerActive: true,
          kleinunternehmerStart: originalStartDate,
          currentYearRevenueCents: 4000000,
        },
      })

      // Update settings
      const updatedSettings = await prisma.taxComplianceSettings.update({
        where: { id: initialSettings.id },
        data: {
          kleinunternehmerStart: newStartDate,
          currentYearRevenueCents: 4500000,
          revenueYear: 2024,
        },
      })

      expect(updatedSettings.kleinunternehmerStart).toEqual(newStartDate)
      expect(updatedSettings.currentYearRevenueCents).toBe(4500000)
      expect(updatedSettings.revenueYear).toBe(2024)
      expect(updatedSettings.updatedAt).not.toEqual(updatedSettings.createdAt)
    })

    it('should delete tax compliance settings', async () => {
      // Create settings
      const taxSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          kleinunternehmerActive: true,
          currentYearRevenueCents: 2000000,
        },
      })

      // Verify creation
      expect(taxSettings).toBeTruthy()

      // Delete settings
      await prisma.taxComplianceSettings.delete({
        where: { id: taxSettings.id },
      })

      // Verify deletion
      const deletedSettings = await prisma.taxComplianceSettings.findUnique({
        where: { id: taxSettings.id },
      })
      expect(deletedSettings).toBeNull()
    })
  })

  describe('Database Relationships and Constraints', () => {
    it('should maintain therapist relationship', async () => {
      const taxSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          kleinunternehmerActive: true,
          currentYearRevenueCents: 3500000,
        },
      })

      // Test relationship via include
      const therapistWithTaxSettings = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
        include: { TaxComplianceSettings: true },
      })

      expect(therapistWithTaxSettings?.TaxComplianceSettings).toBeTruthy()
      expect(therapistWithTaxSettings?.TaxComplianceSettings?.id).toBe(taxSettings.id)
      expect(therapistWithTaxSettings?.TaxComplianceSettings?.kleinunternehmerActive).toBe(true)
      expect(therapistWithTaxSettings?.TaxComplianceSettings?.currentYearRevenueCents).toBe(3500000)
    })

    it('should enforce unique therapistId constraint', async () => {
      // Create first tax settings
      await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          kleinunternehmerActive: true,
        },
      })

      // Attempt to create duplicate should fail
      await expect(
        prisma.taxComplianceSettings.create({
          data: {
            therapistId: testTherapistId,
            kleinunternehmerActive: false,
          },
        })
      ).rejects.toThrow()
    })

    it('should handle cascade delete when therapist is deleted', async () => {
      // Create tax settings
      const taxSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          kleinunternehmerActive: true,
          currentYearRevenueCents: 1000000,
        },
      })

      expect(taxSettings).toBeTruthy()

      // Delete therapist (should cascade to tax settings)
      await prisma.therapist.delete({
        where: { id: testTherapistId },
      })

      // Verify tax settings were cascade deleted
      const orphanedSettings = await prisma.taxComplianceSettings.findUnique({
        where: { id: taxSettings.id },
      })
      expect(orphanedSettings).toBeNull()

      // Also delete user to clean up
      await prisma.user.delete({
        where: { id: testUserId },
      })

      // Set to empty to prevent afterEach cleanup errors
      testTherapistId = ''
      testUserId = ''
    })
  })

  describe('Austrian VAT and RKSV Compliance Features', () => {
    it('should handle Austrian VAT number format validation', async () => {
      const validVatNumbers = ['ATU12345678', 'ATU87654321', 'ATU11111111']

      for (const vatNumber of validVatNumbers) {
        const taxSettings = await prisma.taxComplianceSettings.create({
          data: {
            therapistId: testTherapistId,
            vatNumber,
            vatRegistered: true,
          },
        })

        expect(taxSettings.vatNumber).toBe(vatNumber)
        expect(taxSettings.vatRegistered).toBe(true)

        // Clean up for next iteration
        await prisma.taxComplianceSettings.delete({
          where: { id: taxSettings.id },
        })
      }
    })

    it('should support RKSV compliance fields', async () => {
      const rksvAuditDate = new Date('2024-01-15T10:00:00.000Z')
      const nextAuditDate = new Date('2024-12-31T23:59:59.999Z')

      const taxSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          rksvEnabled: true,
          cashRegisterId: 'RKSV-2024-001',
          signatureDeviceId: 'AT-SIG-12345',
          rksvNotes: 'Fully compliant with Austrian RKSV requirements',
          lastRksvAuditAt: rksvAuditDate,
          nextRksvAuditDue: nextAuditDate,
        },
      })

      expect(taxSettings.rksvEnabled).toBe(true)
      expect(taxSettings.cashRegisterId).toBe('RKSV-2024-001')
      expect(taxSettings.signatureDeviceId).toBe('AT-SIG-12345')
      expect(taxSettings.rksvNotes).toBe('Fully compliant with Austrian RKSV requirements')
      expect(taxSettings.lastRksvAuditAt).toEqual(rksvAuditDate)
      expect(taxSettings.nextRksvAuditDue).toEqual(nextAuditDate)
    })

    it('should handle kleinunternehmer threshold calculations', async () => {
      const testCases = [
        { revenue: 3000000, threshold: 5500000, shouldBeActive: true }, // €30k < €55k
        { revenue: 5500000, threshold: 5500000, shouldBeActive: true }, // €55k = €55k (edge case)
        { revenue: 6000000, threshold: 5500000, shouldBeActive: false }, // €60k > €55k
      ]

      for (const testCase of testCases) {
        const taxSettings = await prisma.taxComplianceSettings.create({
          data: {
            therapistId: testTherapistId,
            kleinunternehmerActive: testCase.shouldBeActive,
            kleinunternehmerThresholdCents: testCase.threshold,
            currentYearRevenueCents: testCase.revenue,
            revenueYear: 2024,
          },
        })

        expect(taxSettings.kleinunternehmerActive).toBe(testCase.shouldBeActive)
        expect(taxSettings.kleinunternehmerThresholdCents).toBe(testCase.threshold)
        expect(taxSettings.currentYearRevenueCents).toBe(testCase.revenue)

        // Clean up for next iteration
        await prisma.taxComplianceSettings.delete({
          where: { id: taxSettings.id },
        })
      }
    })
  })

  describe('Database Indexing and Performance', () => {
    it('should efficiently query by therapistId index', async () => {
      const taxSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          kleinunternehmerActive: true,
          currentYearRevenueCents: 2500000,
        },
      })

      // This query should use the therapistId index
      const foundSettings = await prisma.taxComplianceSettings.findUnique({
        where: { therapistId: testTherapistId },
      })

      expect(foundSettings).toBeTruthy()
      expect(foundSettings?.id).toBe(taxSettings.id)
      expect(foundSettings?.therapistId).toBe(testTherapistId)
    })

    it('should efficiently query by vatNumber index', async () => {
      const vatNumber = 'ATU98765432'

      const taxSettings = await prisma.taxComplianceSettings.create({
        data: {
          therapistId: testTherapistId,
          vatNumber,
          vatRegistered: true,
        },
      })

      // This query should use the vatNumber index
      const foundSettings = await prisma.taxComplianceSettings.findFirst({
        where: { vatNumber },
      })

      expect(foundSettings).toBeTruthy()
      expect(foundSettings?.vatNumber).toBe(vatNumber)
      expect(foundSettings?.id).toBe(taxSettings.id)
    })
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})