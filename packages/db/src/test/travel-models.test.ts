import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Travel-Aware Scheduling Models', () => {
  let testUserId: string
  let testTherapistId: string

  beforeEach(async () => {
    // Generate unique email for each test
    const uniqueEmail = `travel-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
    const uniqueSlug = `travel-test-therapist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create test user and therapist
    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Travel Test User',
      },
    })
    testUserId = user.id

    const therapist = await prisma.therapist.create({
      data: {
        userId: testUserId,
        slug: uniqueSlug,
        designation: 'HEILMASSEUR',
        vatStatus: 'KLEINUNTERNEHMER',
        // Test travel preferences
        travelServiceRadius: 25, // 25km radius
        travelRatePerKm: 80, // 80 cents per km
        defaultTravelBuffer: 45, // 45 minute buffer
        enableTravelService: true,
        maxDailyTravelKm: 100, // 100km daily limit
      },
    })
    testTherapistId = therapist.id
  })

  afterEach(async () => {
    // Clean up test data in correct order to handle foreign key constraints
    await prisma.appointment.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.service.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.client.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.location.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.therapist.deleteMany({ where: { id: testTherapistId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
  })

  describe('Therapist Travel Preferences', () => {
    it('should create therapist with travel preferences', async () => {
      const therapist = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
      })

      expect(therapist).toBeTruthy()
      expect(therapist?.travelServiceRadius).toBe(25)
      expect(therapist?.travelRatePerKm).toBe(80)
      expect(therapist?.defaultTravelBuffer).toBe(45)
      expect(therapist?.enableTravelService).toBe(true)
      expect(therapist?.maxDailyTravelKm).toBe(100)
    })

    it('should have default travel preferences for new therapists', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: 'new-therapist@example.com',
          name: 'New Therapist',
        },
      })

      const newTherapist = await prisma.therapist.create({
        data: {
          userId: newUser.id,
          slug: 'new-therapist-slug',
          designation: 'MEDIZINISCHER_MASSEUR',
          vatStatus: 'UST_20',
        },
      })

      expect(newTherapist.defaultTravelBuffer).toBe(30) // Default from schema
      expect(newTherapist.enableTravelService).toBe(false) // Default disabled
      expect(newTherapist.travelServiceRadius).toBeNull()
      expect(newTherapist.travelRatePerKm).toBeNull()

      // Cleanup
      await prisma.therapist.delete({ where: { id: newTherapist.id } })
      await prisma.user.delete({ where: { id: newUser.id } })
    })
  })

  describe('Location Model with Austrian Address Validation', () => {
    it('should create location with Austrian address components', async () => {
      const location = await prisma.location.create({
        data: {
          therapistId: testTherapistId,
          name: 'Wien Stadtmitte',
          type: 'CLINIC',
          // Austrian address components
          street: 'Mariahilfer Straße',
          streetNumber: '123',
          postalCode: '1060', // Valid Austrian postal code
          city: 'Wien',
          state: 'Wien',
          country: 'Austria',
          districtCode: '06', // Vienna 6th district
          // Geocoding data
          latitude: 48.2006,
          longitude: 16.3506,
          geocodedAt: new Date(),
          isValidated: true,
          travelBufferMin: 15,
        },
      })

      expect(location).toBeTruthy()
      expect(location.postalCode).toBe('1060')
      expect(location.city).toBe('Wien')
      expect(location.country).toBe('Austria')
      expect(location.districtCode).toBe('06')
      expect(location.latitude).toBe(48.2006)
      expect(location.longitude).toBe(16.3506)
      expect(location.isValidated).toBe(true)
      expect(location.createdAt).toBeInstanceOf(Date)
      expect(location.updatedAt).toBeInstanceOf(Date)
    })

    it('should create location with legacy address field', async () => {
      const location = await prisma.location.create({
        data: {
          therapistId: testTherapistId,
          name: 'Legacy Address Location',
          type: 'HOME',
          address: 'Schönbrunner Schloßstraße 47, 1130 Wien', // Legacy format
          travelBufferMin: 20,
        },
      })

      expect(location.address).toBe('Schönbrunner Schloßstraße 47, 1130 Wien')
      expect(location.country).toBe('Austria') // Default value
      expect(location.isValidated).toBe(false) // Default value
    })

    it('should handle Austrian postal code patterns', async () => {
      // Test various Austrian postal code patterns
      const postalCodes = ['1010', '1230', '5020', '6020', '8010', '9020']

      for (const postalCode of postalCodes) {
        const location = await prisma.location.create({
          data: {
            therapistId: testTherapistId,
            name: `Test Location ${postalCode}`,
            type: 'MOBILE',
            postalCode,
            city: 'Test City',
          },
        })

        expect(location.postalCode).toBe(postalCode)
        expect(location.postalCode).toMatch(/^\d{4}$/) // 4-digit format
      }
    })
  })

  describe('Appointment Model with Travel Fields', () => {
    let testClientId: string
    let testServiceId: string
    let testLocationId: string

    beforeEach(async () => {
      // Create test client
      const client = await prisma.client.create({
        data: {
          therapistId: testTherapistId,
          name: 'Travel Test Client',
          email: 'client@example.com',
          postalCode: '1010',
          city: 'Wien',
        },
      })
      testClientId = client.id

      // Create test service
      const service = await prisma.service.create({
        data: {
          therapistId: testTherapistId,
          name: 'Mobile Massage',
          category: 'MASSAGE',
          durationMin: 60,
          priceCents: 8000, // €80
          vatRate: 'KLEINUNTERNEHMER',
        },
      })
      testServiceId = service.id

      // Create test location
      const location = await prisma.location.create({
        data: {
          therapistId: testTherapistId,
          name: 'Client Home',
          type: 'MOBILE',
          postalCode: '1020',
          city: 'Wien',
          latitude: 48.2167,
          longitude: 16.3833,
        },
      })
      testLocationId = location.id
    })

    afterEach(async () => {
      // Note: appointments are cleaned up in the main afterEach
      // These specific resources will be cleaned up there as well
      // No additional cleanup needed here since main afterEach handles all therapist-related data
    })

    it('should create appointment with travel calculations', async () => {
      const appointmentStart = new Date('2024-01-15T10:00:00Z')
      const appointmentEnd = new Date('2024-01-15T11:00:00Z')

      const appointment = await prisma.appointment.create({
        data: {
          therapistId: testTherapistId,
          clientId: testClientId,
          serviceId: testServiceId,
          locationId: testLocationId,
          start: appointmentStart,
          end: appointmentEnd,
          status: 'BOOKED',
          // Travel-related fields
          estimatedTravelTimeMin: 25, // 25 minutes travel time
          travelDistanceKm: 8.5, // 8.5km distance
          travelCostCents: 680, // 8.5km * 80 cents/km
          requiresTravelBuffer: true,
        },
      })

      expect(appointment).toBeTruthy()
      expect(appointment.estimatedTravelTimeMin).toBe(25)
      expect(appointment.travelDistanceKm).toBe(8.5)
      expect(appointment.travelCostCents).toBe(680)
      expect(appointment.requiresTravelBuffer).toBe(true)
    })

    it('should create appointment without travel requirements', async () => {
      const appointment = await prisma.appointment.create({
        data: {
          therapistId: testTherapistId,
          clientId: testClientId,
          serviceId: testServiceId,
          locationId: testLocationId,
          start: new Date('2024-01-15T14:00:00Z'),
          end: new Date('2024-01-15T15:00:00Z'),
          status: 'BOOKED',
          requiresTravelBuffer: false, // No travel required
        },
      })

      expect(appointment.requiresTravelBuffer).toBe(false)
      expect(appointment.estimatedTravelTimeMin).toBeNull()
      expect(appointment.travelDistanceKm).toBeNull()
      expect(appointment.travelCostCents).toBeNull()
    })

    it('should support appointment indexing by location and start time', async () => {
      // Create multiple appointments for the same location
      const appointments = []
      for (let i = 0; i < 3; i++) {
        const appointment = await prisma.appointment.create({
          data: {
            therapistId: testTherapistId,
            clientId: testClientId,
            serviceId: testServiceId,
            locationId: testLocationId,
            start: new Date(`2024-01-15T${10 + i}:00:00Z`),
            end: new Date(`2024-01-15T${11 + i}:00:00Z`),
            status: 'BOOKED',
            requiresTravelBuffer: true,
          },
        })
        appointments.push(appointment)
      }

      // Query appointments by therapist and location
      const locationAppointments = await prisma.appointment.findMany({
        where: {
          therapistId: testTherapistId,
          locationId: testLocationId,
        },
        orderBy: {
          start: 'asc',
        },
      })

      expect(locationAppointments).toHaveLength(3)
      // Check the ordering is correct rather than specific hours (timezone-agnostic)
      expect(locationAppointments[0].start < locationAppointments[1].start).toBe(true)
      expect(locationAppointments[1].start < locationAppointments[2].start).toBe(true)

      // Verify UTC hours match what we created
      expect(locationAppointments[0].start.getUTCHours()).toBe(10)
      expect(locationAppointments[1].start.getUTCHours()).toBe(11)
      expect(locationAppointments[2].start.getUTCHours()).toBe(12)
    })
  })

  describe('Database Relationships and Constraints', () => {
    it('should maintain referential integrity', async () => {
      // Create location
      const location = await prisma.location.create({
        data: {
          therapistId: testTherapistId,
          name: 'Test Location',
          type: 'CLINIC',
          postalCode: '1010',
          city: 'Wien',
        },
      })

      // Verify therapist relationship
      const therapistWithLocation = await prisma.therapist.findUnique({
        where: { id: testTherapistId },
        include: { Locations: true },
      })

      expect(therapistWithLocation?.Locations).toHaveLength(1)
      expect(therapistWithLocation?.Locations[0].id).toBe(location.id)
    })

    it('should enforce postal code and city indexing', async () => {
      // Create locations with same postal code
      const locations = await Promise.all([
        prisma.location.create({
          data: {
            therapistId: testTherapistId,
            name: 'Location 1',
            type: 'CLINIC',
            postalCode: '1010',
            city: 'Wien',
          },
        }),
        prisma.location.create({
          data: {
            therapistId: testTherapistId,
            name: 'Location 2',
            type: 'CLINIC',
            postalCode: '1010',
            city: 'Wien',
          },
        }),
      ])

      // Query by postal code
      const viennaLocations = await prisma.location.findMany({
        where: {
          postalCode: '1010',
          city: 'Wien',
        },
      })

      expect(viennaLocations.length).toBeGreaterThanOrEqual(2)
    })
  })
})