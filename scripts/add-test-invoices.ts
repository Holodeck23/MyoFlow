#!/usr/bin/env node
/**
 * Add test invoices for test@myoflow.com account
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding test@myoflow.com account...')

  const testUser = await prisma.user.findUnique({
    where: { email: 'test@myoflow.com' },
    include: { Therapist: { include: { Clients: true } } }
  })

  if (!testUser?.Therapist) {
    console.error('❌ test@myoflow.com account not found or has no therapist profile')
    process.exit(1)
  }

  const therapistId = testUser.Therapist.id
  console.log(`✅ Found therapist: ${therapistId}`)

  // Check existing invoices
  const existingInvoices = await prisma.invoice.findMany({
    where: { therapistId },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  console.log(`\n📊 Current invoices: ${existingInvoices.length > 0 ? existingInvoices.length + ' found' : 'None'}`)

  if (existingInvoices.length > 0) {
    console.log('\nMost recent invoices:')
    existingInvoices.forEach(inv => {
      console.log(`  - ${inv.number} | ${inv.createdAt.toLocaleDateString()} | ${inv.status} | €${inv.totalGrossCents / 100}`)
    })
  }

  // Get or create a test client
  let client = testUser.Therapist.Clients[0]

  if (!client) {
    console.log('\n📝 Creating test client...')
    client = await prisma.client.create({
      data: {
        therapistId,
        name: 'Müller GmbH',
        email: 'mueller@example.com',
        phone: '+43 732 123456',
        street: 'Hauptstraße 23',
        postalCode: '4020',
        city: 'Linz',
        country: 'Austria'
      }
    })
    console.log(`✅ Created client: ${client.name}`)
  } else {
    console.log(`✅ Using existing client: ${client.name}`)
  }

  // Create test invoices for September-October 2025
  console.log('\n📄 Creating test invoices...')

  const invoices = [
    {
      date: new Date('2025-09-15'),
      amount: 12000, // €120
      kleinunternehmer: false,
      vatRate: 20,
      status: 'PAID' as const
    },
    {
      date: new Date('2025-09-20'),
      amount: 8500, // €85
      kleinunternehmer: true,
      vatRate: 0,
      status: 'SENT' as const
    },
    {
      date: new Date('2025-09-25'),
      amount: 15600, // €156
      kleinunternehmer: false,
      vatRate: 13,
      status: 'PAID' as const
    },
    {
      date: new Date('2025-10-05'),
      amount: 9000, // €90
      kleinunternehmer: false,
      vatRate: 10,
      status: 'SENT' as const
    },
    {
      date: new Date('2025-10-12'),
      amount: 18000, // €180
      kleinunternehmer: false,
      vatRate: 20,
      status: 'PAID' as const
    }
  ]

  let createdCount = 0

  for (const inv of invoices) {
    const invoiceNumber = `RE-2025-${String(existingInvoices.length + createdCount + 1).padStart(3, '0')}`

    const netCents = inv.kleinunternehmer
      ? inv.amount
      : Math.round(inv.amount / (1 + inv.vatRate / 100))
    const vatCents = inv.kleinunternehmer ? 0 : inv.amount - netCents

    const vatBreakdown = inv.kleinunternehmer
      ? {}
      : {
          [inv.vatRate]: {
            netCents,
            vatCents,
            grossCents: inv.amount,
            vatRate: inv.vatRate
          }
        }

    await prisma.invoice.create({
      data: {
        therapistId,
        clientId: client.id,
        number: invoiceNumber,
        status: inv.status,
        totalGrossCents: inv.amount,
        kleinunternehmer: inv.kleinunternehmer,
        createdAt: inv.date,
        lines: [
          {
            description: 'Massage Therapy Session',
            quantity: 1,
            unitPriceCents: netCents,
            totalCents: netCents,
            vatRate: inv.vatRate
          }
        ],
        vatBreakdown
      }
    })

    console.log(`  ✅ ${invoiceNumber} | ${inv.date.toLocaleDateString()} | ${inv.status} | €${inv.amount / 100} | ${inv.kleinunternehmer ? 'Kleinunternehmer' : `VAT ${inv.vatRate}%`}`)
    createdCount++
  }

  console.log(`\n✅ Created ${createdCount} test invoices`)
  console.log('\n📅 DATE RANGE TO USE IN UI:')
  console.log('  Start Date: 2025-09-01')
  console.log('  End Date:   2025-10-31')
  console.log('\n✓ Make sure SENT and PAID are both checked!')
  console.log('\n🔗 Navigate to: http://localhost:3002/dashboard/settings?tab=accounting-exports')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
