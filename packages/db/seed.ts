import { PrismaClient, TherapistDesignation, VatStatus, LocationType, ServiceCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
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
    }
  })

  console.log('✅ Created therapist:', testTherapist.slug)

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

  console.log('🎉 Database seed completed successfully!')
  console.log(`
Test login credentials:
- Email: test@myoflow.at
- This will work with both Google OAuth and email authentication
- Therapist slug: dr-sarah-mueller
- Created ${clients.length} test clients
- Created ${services.length} services  
- Created ${appointments.length} upcoming appointments
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