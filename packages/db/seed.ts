import {
  PrismaClient,
  TherapistDesignation,
  VatStatus,
  LocationType,
  ServiceCategory,
  CredentialStatus,
  CredentialType,
  CredentialVerificationStatus,
  ExportTargetSystem,
  ExportType,
  TransportMethod,
  Locale,
  Currency,
  SubscriptionStatus,
  AccountType,
  Role,
} from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Check if seeding is explicitly requested
const shouldSeed = process.env.SEED_DATA === 'true' || process.argv.includes('--seed')

async function main() {
  if (!shouldSeed) {
    console.log('⏭️  Skipping seed - use SEED_DATA=true or --seed flag to create test data')
    return
  }

  console.log('🌱 Starting database seed...')

  // Create test user and therapist
  const testUser = await prisma.user.upsert({
    where: { email: 'test@myoflow.at' },
    update: {},
    create: {
      email: 'test@myoflow.at',
      name: 'Dr. Sarah Müller',
      role: 'OWNER',
    }
  })

  console.log('✅ Created user:', testUser.email)

  // Ensure platform admin exists for admin interface smoke tests
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@myoflow.at'
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'admin123'
  const hashedAdminPassword = await hash(adminPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.SUPER_ADMIN,
      accountType: AccountType.ADMIN,
      password: hashedAdminPassword,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      trialStarted: null,
    },
    create: {
      email: adminEmail,
      name: 'Platform Admin',
      role: Role.SUPER_ADMIN,
      accountType: AccountType.ADMIN,
      password: hashedAdminPassword,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      trialStarted: null,
    },
  })

  console.log('✅ Ensured admin user:', adminUser.email)

  // Create therapist profile
  const testTherapist = await prisma.therapist.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      slug: 'dr-sarah-mueller',
      designation: TherapistDesignation.HEILMASSEUR,
      vatStatus: VatStatus.KLEINUNTERNEHMER,
      kleinunternehmer: true,
      annualGrossCents: 0,
      brandColor: '#3B82F6',
      certificates: [], // Explicitly set certificates array
    }
  })

  console.log('✅ Created therapist:', testTherapist.slug)

  // Ensure baseline settings records exist
  const travelSettings = await prisma.travelSettings.upsert({
    where: { therapistId: testTherapist.id },
    update: {},
    create: {
      therapistId: testTherapist.id,
      baseAddressLine1: 'Hauptplatz 1',
      baseCity: 'Linz',
      basePostalCode: '4020',
      baseState: 'Oberösterreich',
      latitude: 48.3069,
      longitude: 14.2858,
      serviceRadiusKm: 25,
      transportMethod: TransportMethod.CAR,
      ratePerKmCents: 45,
      minimumTravelChargeCents: 700,
      travelBufferMinutes: 20,
      preferredRegions: ['40'],
      excludedRegions: ['48'],
    },
  })

  const taxSettings = await prisma.taxComplianceSettings.upsert({
    where: { therapistId: testTherapist.id },
    update: {},
    create: {
      therapistId: testTherapist.id,
      vatNumber: null,
      vatRegistered: false,
      kleinunternehmerActive: true,
      kleinunternehmerThresholdCents: 5500000,
      currentYearRevenueCents: 0,
      revenueYear: new Date().getFullYear(),
      legalNoticeTemplate: 'Kein Ausweis der Umsatzsteuer gemäß § 6 Abs. 1 Z 27 UStG.',
      rksvEnabled: false,
    },
  })

  const preferences = await prisma.userPreferences.upsert({
    where: { therapistId: testTherapist.id },
    update: {},
    create: {
      therapistId: testTherapist.id,
      language: Locale.DE,
      timezone: 'Europe/Vienna',
      currency: Currency.EUR,
      dateFormat: 'DD.MM.YYYY',
      numberFormat: '1.234,56',
      appointmentReminderDays: 1,
      enableEmailNotifications: true,
      enableComplianceAlerts: true,
    },
  })

  const credential = await prisma.therapistCredential.upsert({
    where: {
      therapistId_title: {
        therapistId: testTherapist.id,
        title: 'Medizinischer Masseur Ausbildung'
      }
    },
    update: {},
    create: {
      therapistId: testTherapist.id,
      credentialType: CredentialType.PROFESSIONAL_LICENSE,
      title: 'Medizinischer Masseur Ausbildung',
      issuingAuthority: 'Bundesministerium für Gesundheit',
      credentialNumber: 'MM-2020-AT-001',
      issueDate: new Date('2020-03-01'),
      expirationDate: null,
      status: CredentialStatus.ACTIVE,
      verificationStatus: CredentialVerificationStatus.VERIFIED,
    },
  })

  const exportConfig = await prisma.exportConfiguration.upsert({
    where: {
      therapistId_targetSystem_configurationName: {
        therapistId: testTherapist.id,
        targetSystem: ExportTargetSystem.BMD,
        configurationName: 'BMD Standard Export'
      }
    },
    update: {},
    create: {
      therapistId: testTherapist.id,
      exportType: ExportType.ACCOUNTING_EXPORT,
      targetSystem: ExportTargetSystem.BMD,
      configurationName: 'BMD Standard Export',
      description: 'Standard CSV export for Austrian accounting software BMD',
      isDefault: true,
      fieldMappings: {
        invoiceNumber: 'belegnummer',
        bookingDate: 'buchungsdatum',
        grossAmount: 'betragBrutto',
      }
    },
  })

  console.log('✅ Settings seed complete:', {
    travelSettings: travelSettings.transportMethod,
    taxSettings: taxSettings.kleinunternehmerActive,
    preferences: preferences.language,
    credential: credential.title,
    exportConfig: exportConfig.configurationName,
  })

  // Create locations
  const homeLocation = await prisma.location.create({
    data: {
      therapistId: testTherapist.id,
      name: 'Praxis Wien',
      type: LocationType.CLINIC,
      address: 'Mariahilfer Straße 123, 1060 Wien',
    }
  })

  const mobileLocation = await prisma.location.create({
    data: {
      therapistId: testTherapist.id,
      name: 'Hausbesuch',
      type: LocationType.MOBILE,
      travelBufferMin: 30,
    }
  })

  console.log('✅ Created locations:', [homeLocation.name, mobileLocation.name])

  // Create service rate templates
  const serviceRateTemplates = await Promise.all([
    prisma.serviceRateTemplate.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Klassische Massage 60min',
        category: ServiceCategory.MASSAGE,
        durationMin: 60,
        priceCents: 8000, // €80
        vatRate: VatStatus.KLEINUNTERNEHMER,
        description: 'Standard-Ganzkörpermassage zur Entspannung und Schmerzlinderung',
        isDefault: true,
      }
    }),
    prisma.serviceRateTemplate.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Kurzmassage 30min',
        category: ServiceCategory.MASSAGE,
        durationMin: 30,
        priceCents: 5000, // €50
        vatRate: VatStatus.KLEINUNTERNEHMER,
        description: 'Gezielte Behandlung für Schulter, Nacken oder Rücken',
        isDefault: false,
      }
    }),
    prisma.serviceRateTemplate.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Entspannungsmassage 45min',
        category: ServiceCategory.MASSAGE,
        durationMin: 45,
        priceCents: 6500, // €65
        vatRate: VatStatus.KLEINUNTERNEHMER,
        description: 'Sanfte Wellness-Massage mit ätherischen Ölen',
        isDefault: false,
      }
    }),
    prisma.serviceRateTemplate.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Erstberatung',
        category: ServiceCategory.CONSULTING,
        durationMin: 30,
        priceCents: 5000, // €50
        vatRate: VatStatus.KLEINUNTERNEHMER,
        description: 'Ausführliche Anamnese und Behandlungsplanung',
        isDefault: true,
      }
    }),
    prisma.serviceRateTemplate.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Nachberatung',
        category: ServiceCategory.CONSULTING,
        durationMin: 15,
        priceCents: 2500, // €25
        vatRate: VatStatus.KLEINUNTERNEHMER,
        description: 'Kurzes Beratungsgespräch zur Behandlungsnachbereitung',
        isDefault: false,
      }
    }),
  ])

  console.log('✅ Created service rate templates:', serviceRateTemplates.map(t => `${t.name} (€${t.priceCents/100})`))

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Klassische Massage',
        category: ServiceCategory.MASSAGE,
        durationMin: 60,
        priceCents: 8000, // €80
        vatRate: VatStatus.KLEINUNTERNEHMER,
      }
    }),
    prisma.service.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Entspannungsmassage',
        category: ServiceCategory.MASSAGE,
        durationMin: 45,
        priceCents: 6500, // €65
        vatRate: VatStatus.KLEINUNTERNEHMER,
      }
    }),
    prisma.service.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Beratungsgespräch',
        category: ServiceCategory.CONSULTING,
        durationMin: 30,
        priceCents: 5000, // €50
        vatRate: VatStatus.KLEINUNTERNEHMER,
      }
    }),
  ])

  console.log('✅ Created services:', services.map(s => s.name))

  // Create test clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Maria Schmidt',
        email: 'maria@example.com',
        phone: '+43 664 123 4567',
        tags: ['Stammkunde', 'Rückenschmerzen'],
      }
    }),
    prisma.client.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Johann Weber',
        email: 'johann@example.com',
        phone: '+43 664 765 4321',
        tags: ['Neukunde'],
      }
    }),
    prisma.client.create({
      data: {
        therapistId: testTherapist.id,
        name: 'Anna Huber',
        email: 'anna@example.com',
        phone: '+43 699 987 6543',
        tags: ['Sport', 'Massage'],
      }
    }),
  ])

  console.log('✅ Created clients:', clients.map(c => c.name))

  // Create test appointments (next 2 weeks)
  const now = new Date()
  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        therapistId: testTherapist.id,
        clientId: clients[0].id,
        serviceId: services[0].id,
        locationId: homeLocation.id,
        start: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
        end: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +2 days +1h
        status: 'BOOKED',
        notes: 'Erste Behandlung nach Beratung',
      }
    }),
    prisma.appointment.create({
      data: {
        therapistId: testTherapist.id,
        clientId: clients[1].id,
        serviceId: services[1].id,
        locationId: mobileLocation.id,
        start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 days
        end: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // +5 days +45min
        status: 'BOOKED',
        notes: 'Hausbesuch - Verspannungen Nacken/Schulter',
      }
    }),
  ])

  console.log('✅ Created appointments:', appointments.length)

  // Create test invoices
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        therapistId: testTherapist.id,
        clientId: clients[1].id, // Johann Weber
        appointmentId: appointments[1].id, // Entspannungsmassage appointment
        number: '2025-001',
        status: 'SENT',
        lines: [{
          description: 'Entspannungsmassage 45min',
          quantity: 1,
          unitPriceCents: 6500,
          vatRate: 'KLEINUNTERNEHMER',
          totalCents: 6500
        }],
        totalGrossCents: 6500,
        vatBreakdown: {
          kleinunternehmer: 6500,
          vat10: 0,
          vat13: 0,
          vat20: 0,
          totalVat: 0,
          totalNet: 6500
        },
        kleinunternehmer: true
      }
    }),
    prisma.invoice.create({
      data: {
        therapistId: testTherapist.id,
        clientId: clients[0].id, // Maria Schmidt
        appointmentId: appointments[0].id, // Klassische Massage appointment
        number: '2025-002',
        status: 'PAID',
        lines: [{
          description: 'Klassische Massage 60min',
          quantity: 1,
          unitPriceCents: 8000,
          vatRate: 'KLEINUNTERNEHMER',
          totalCents: 8000
        }],
        totalGrossCents: 8000,
        vatBreakdown: {
          kleinunternehmer: 8000,
          vat10: 0,
          vat13: 0,
          vat20: 0,
          totalVat: 0,
          totalNet: 8000
        },
        kleinunternehmer: true
      }
    }),
    prisma.invoice.create({
      data: {
        therapistId: testTherapist.id,
        clientId: clients[2].id, // Anna Huber
        number: '2025-003',
        status: 'DRAFT',
        lines: [{
          description: 'Triggerpunkt-Massage 45min',
          quantity: 1,
          unitPriceCents: 7500,
          vatRate: 'KLEINUNTERNEHMER',
          totalCents: 7500
        }],
        totalGrossCents: 7500,
        vatBreakdown: {
          kleinunternehmer: 7500,
          vat10: 0,
          vat13: 0,
          vat20: 0,
          totalVat: 0,
          totalNet: 7500
        },
        kleinunternehmer: true
      }
    })
  ])

  console.log('✅ Created test invoices:', invoices.map(inv => `${inv.number} (${inv.status}): €${inv.totalGrossCents / 100}`))

  console.log('🎉 Database seed completed successfully!')
  console.log(`
Test login credentials:
- Email: test@myoflow.at
- This will work with both Google OAuth and email authentication
- Therapist slug: dr-sarah-mueller
- Created ${clients.length} test clients
- Created ${services.length} services
- Created ${appointments.length} upcoming appointments
- Created ${invoices.length} test invoices
`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
