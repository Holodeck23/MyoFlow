import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { prisma } from '../..'

describe('Appointment Reminder System', () => {
  let testUserId: string
  let testTherapistId: string
  let testClientId: string
  let testServiceId: string
  let testLocationId: string
  let testAppointmentId: string

  beforeEach(async () => {
    // Generate unique identifiers for each test
    const uniqueEmail = `reminder-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
    const uniqueSlug = `reminder-test-therapist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create test user and therapist
    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Reminder Test User',
      },
    })
    testUserId = user.id

    const therapist = await prisma.therapist.create({
      data: {
        userId: testUserId,
        slug: uniqueSlug,
        designation: 'HEILMASSEUR',
        vatStatus: 'KLEINUNTERNEHMER',
        enableEmailReminders: true,
        defaultReminderDays: 1,
      },
    })
    testTherapistId = therapist.id

    // Create test client with email preferences
    const client = await prisma.client.create({
      data: {
        therapistId: testTherapistId,
        name: 'Test Client',
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
        name: 'Massage Therapy',
        category: 'MASSAGE',
        durationMin: 60,
        priceCents: 8000,
        vatRate: 'KLEINUNTERNEHMER',
      },
    })
    testServiceId = service.id

    // Create test location
    const location = await prisma.location.create({
      data: {
        therapistId: testTherapistId,
        name: 'Test Clinic',
        type: 'CLINIC',
        postalCode: '1010',
        city: 'Wien',
      },
    })
    testLocationId = location.id

    // Create test appointment
    const appointment = await prisma.appointment.create({
      data: {
        therapistId: testTherapistId,
        clientId: testClientId,
        serviceId: testServiceId,
        locationId: testLocationId,
        start: new Date('2024-02-15T10:00:00Z'),
        end: new Date('2024-02-15T11:00:00Z'),
        status: 'BOOKED',
      },
    })
    testAppointmentId = appointment.id
  })

  afterEach(async () => {
    // Clean up test data in correct order for foreign key constraints
    await prisma.appointmentReminder.deleteMany({ where: { appointmentId: testAppointmentId } })
    await prisma.appointment.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.service.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.consent.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.client.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.location.deleteMany({ where: { therapistId: testTherapistId } })
    await prisma.therapist.deleteMany({ where: { id: testTherapistId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
  })

  describe('AppointmentReminder Model Extensions', () => {
    it('should create reminder with delivery tracking fields', async () => {
      const scheduledFor = new Date('2024-02-14T10:00:00Z') // 24h before appointment

      const reminder = await prisma.appointmentReminder.create({
        data: {
          appointmentId: testAppointmentId,
          type: 'EMAIL',
          status: 'SENT',
          scheduledFor,
          sentAt: new Date('2024-02-14T10:00:30Z'),
          deliveredAt: new Date('2024-02-14T10:01:15Z'),
        },
      })

      expect(reminder).toBeTruthy()
      expect(reminder.type).toBe('EMAIL')
      expect(reminder.status).toBe('SENT')
      expect(reminder.scheduledFor).toEqual(scheduledFor)
      expect(reminder.sentAt).toBeInstanceOf(Date)
      expect(reminder.deliveredAt).toBeInstanceOf(Date)
      expect(reminder.failureReason).toBeNull()
    })

    it('should create failed reminder with failure tracking', async () => {
      const reminder = await prisma.appointmentReminder.create({
        data: {
          appointmentId: testAppointmentId,
          type: 'EMAIL',
          status: 'FAILED',
          scheduledFor: new Date('2024-02-14T10:00:00Z'),
          sentAt: new Date('2024-02-14T10:00:30Z'),
          failureReason: 'SMTP delivery failed: Invalid email address',
        },
      })

      expect(reminder.status).toBe('FAILED')
      expect(reminder.failureReason).toBe('SMTP delivery failed: Invalid email address')
      expect(reminder.deliveredAt).toBeNull()
    })

    it('should create pending reminder without delivery timestamps', async () => {
      const reminder = await prisma.appointmentReminder.create({
        data: {
          appointmentId: testAppointmentId,
          type: 'EMAIL',
          status: 'PENDING',
          scheduledFor: new Date('2024-02-14T10:00:00Z'),
        },
      })

      expect(reminder.status).toBe('PENDING')
      expect(reminder.sentAt).toBeNull()
      expect(reminder.deliveredAt).toBeNull()
      expect(reminder.failureReason).toBeNull()
    })

    it('should support multiple reminders per appointment', async () => {
      // Create 24h reminder
      const reminder24h = await prisma.appointmentReminder.create({
        data: {
          appointmentId: testAppointmentId,
          type: 'EMAIL',
          status: 'SENT',
          scheduledFor: new Date('2024-02-14T10:00:00Z'),
          sentAt: new Date('2024-02-14T10:00:30Z'),
          deliveredAt: new Date('2024-02-14T10:01:15Z'),
        },
      })

      // Create 2h reminder
      const reminder2h = await prisma.appointmentReminder.create({
        data: {
          appointmentId: testAppointmentId,
          type: 'EMAIL',
          status: 'PENDING',
          scheduledFor: new Date('2024-02-15T08:00:00Z'),
        },
      })

      const reminders = await prisma.appointmentReminder.findMany({
        where: { appointmentId: testAppointmentId },
        orderBy: { scheduledFor: 'asc' },
      })

      expect(reminders).toHaveLength(2)
      expect(reminders[0].id).toBe(reminder24h.id)
      expect(reminders[1].id).toBe(reminder2h.id)
    })

    it('should maintain relationship with appointment', async () => {
      const reminder = await prisma.appointmentReminder.create({
        data: {
          appointmentId: testAppointmentId,
          type: 'EMAIL',
          status: 'SENT',
          scheduledFor: new Date('2024-02-14T10:00:00Z'),
          sentAt: new Date('2024-02-14T10:00:30Z'),
        },
      })

      // Test relationship from reminder to appointment
      const reminderWithAppointment = await prisma.appointmentReminder.findUnique({
        where: { id: reminder.id },
        include: { Appointment: true },
      })

      expect(reminderWithAppointment?.Appointment).toBeTruthy()
      expect(reminderWithAppointment?.Appointment.id).toBe(testAppointmentId)

      // Test relationship from appointment to reminders
      const appointmentWithReminders = await prisma.appointment.findUnique({
        where: { id: testAppointmentId },
        include: { Reminders: true },
      })

      expect(appointmentWithReminders?.Reminders).toHaveLength(1)
      expect(appointmentWithReminders?.Reminders[0].id).toBe(reminder.id)
    })
  })

  describe('Client Email Preferences', () => {
    it('should create client with email reminder preferences', async () => {
      const clientWithPrefs = await prisma.client.create({
        data: {
          therapistId: testTherapistId,
          name: 'Client with Preferences',
          email: 'prefs@example.com',
          emailRemindersEnabled: true,
          reminderPreference: 'BOTH', // 24h + 2h
        },
      })

      expect(clientWithPrefs.emailRemindersEnabled).toBe(true)
      expect(clientWithPrefs.reminderPreference).toBe('BOTH')
    })

    it('should support different reminder preferences', async () => {
      const clients = await Promise.all([
        prisma.client.create({
          data: {
            therapistId: testTherapistId,
            name: 'Client 24h Only',
            email: 'client24h@example.com',
            emailRemindersEnabled: true,
            reminderPreference: 'HOURS_24_ONLY',
          },
        }),
        prisma.client.create({
          data: {
            therapistId: testTherapistId,
            name: 'Client 2h Only',
            email: 'client2h@example.com',
            emailRemindersEnabled: true,
            reminderPreference: 'HOURS_2_ONLY',
          },
        }),
        prisma.client.create({
          data: {
            therapistId: testTherapistId,
            name: 'Client No Reminders',
            email: 'clientno@example.com',
            emailRemindersEnabled: false,
            reminderPreference: 'NONE',
          },
        }),
      ])

      expect(clients[0].reminderPreference).toBe('HOURS_24_ONLY')
      expect(clients[1].reminderPreference).toBe('HOURS_2_ONLY')
      expect(clients[2].emailRemindersEnabled).toBe(false)
      expect(clients[2].reminderPreference).toBe('NONE')
    })

    it('should default to enabled reminders for new clients', async () => {
      const defaultClient = await prisma.client.create({
        data: {
          therapistId: testTherapistId,
          name: 'Default Client',
          email: 'default@example.com',
        },
      })

      expect(defaultClient.emailRemindersEnabled).toBe(true) // Should default to true
      expect(defaultClient.reminderPreference).toBe('BOTH') // Should default to BOTH
    })
  })

  describe('Reminder Status Indexing', () => {
    it('should support efficient queries by status and scheduledFor', async () => {
      // Create multiple reminders with different statuses
      const reminders = await Promise.all([
        prisma.appointmentReminder.create({
          data: {
            appointmentId: testAppointmentId,
            type: 'EMAIL',
            status: 'PENDING',
            scheduledFor: new Date('2024-02-14T09:00:00Z'),
          },
        }),
        prisma.appointmentReminder.create({
          data: {
            appointmentId: testAppointmentId,
            type: 'EMAIL',
            status: 'PENDING',
            scheduledFor: new Date('2024-02-14T10:00:00Z'),
          },
        }),
        prisma.appointmentReminder.create({
          data: {
            appointmentId: testAppointmentId,
            type: 'EMAIL',
            status: 'SENT',
            scheduledFor: new Date('2024-02-14T11:00:00Z'),
            sentAt: new Date(),
          },
        }),
      ])

      // Query pending reminders scheduled before a certain time
      const pendingReminders = await prisma.appointmentReminder.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: new Date('2024-02-14T09:30:00Z'),
          },
        },
      })

      expect(pendingReminders).toHaveLength(1)
      expect(pendingReminders[0].id).toBe(reminders[0].id)

      // Query all pending reminders
      const allPendingReminders = await prisma.appointmentReminder.findMany({
        where: { status: 'PENDING' },
        orderBy: { scheduledFor: 'asc' },
      })

      expect(allPendingReminders).toHaveLength(2)
      expect(allPendingReminders[0].scheduledFor < allPendingReminders[1].scheduledFor).toBe(true)
    })
  })

  describe('Austrian GDPR Compliance Support', () => {
    it('should support consent tracking for reminder communications', async () => {
      // Create consent record for email communications
      const consent = await prisma.consent.create({
        data: {
          therapistId: testTherapistId,
          clientId: testClientId,
          docVersion: 'v1.0',
          acceptedAt: new Date(),
          ip: '192.168.1.1',
          payloadEnc: 'encrypted_consent_payload_for_email_reminders',
        },
      })

      // Verify client has consent for reminders
      const clientWithConsent = await prisma.client.findUnique({
        where: { id: testClientId },
        include: { Consents: true },
      })

      expect(clientWithConsent?.Consents).toHaveLength(1)
      expect(clientWithConsent?.Consents[0].docVersion).toBe('v1.0')
    })

    it('should handle email unsubscribe scenarios', async () => {
      // Update client to opt out of email reminders
      const updatedClient = await prisma.client.update({
        where: { id: testClientId },
        data: {
          emailRemindersEnabled: false,
          reminderPreference: 'NONE',
        },
      })

      expect(updatedClient.emailRemindersEnabled).toBe(false)
      expect(updatedClient.reminderPreference).toBe('NONE')

      // Verify no new reminders should be created for this client
      const clientCheck = await prisma.client.findUnique({
        where: { id: testClientId },
      })

      expect(clientCheck?.emailRemindersEnabled).toBe(false)
    })
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})