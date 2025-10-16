import { NextRequest, NextResponse } from 'next/server'
import { prisma, AccountType } from '@myoflow/db'
import { requireTherapist } from '@/lib/shared-helpers'
import { calculateProfileCompletion } from '../../utils/profileCompletion'
import {
  assertValidAustrianIban,
  assertValidVatNumber,
} from '@myoflow/lib'

interface ChecklistItem {
  id: string
  label: string
  description: string
  complete: boolean
}

async function sendUpgradeConfirmationEmail(email: string | null | undefined) {
  if (!email) {
    return
  }
  console.info(`[Upgrade] Production activation confirmation queued for ${email}`)
}

export async function buildUpgradeChecklist(therapistId: string) {
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
    select: {
      businessName: true,
      businessAddress: true,
      businessEmail: true,
      businessPhone: true,
      vatStatus: true,
      kleinunternehmer: true,
      uidNumber: true,
      invoiceFooter: true,
      invoiceThankYouMessage: true,
      iban: true,
      invoiceLogoUrl: true,
    },
  })

  const taxSettings = await prisma.taxComplianceSettings.findUnique({
    where: { therapistId },
    select: {
      vatRegistered: true,
      kleinunternehmerActive: true,
      vatNumber: true,
      taxAdvisorName: true,
      taxAdvisorEmail: true,
    },
  })

  const profileCompletion = calculateProfileCompletion(therapist, taxSettings)
  const profileComplete = profileCompletion.score >= 100

  let ibanValid = false
  if (therapist?.iban) {
    try {
      assertValidAustrianIban(therapist.iban)
      ibanValid = true
    } catch (error) {
      ibanValid = false
    }
  }

  let taxConfigured = false
  if (taxSettings) {
    if (taxSettings.vatRegistered) {
      try {
        assertValidVatNumber(taxSettings.vatNumber ?? '')
        taxConfigured = true
      } catch (error) {
        taxConfigured = false
      }
    } else if (taxSettings.kleinunternehmerActive !== null && taxSettings.kleinunternehmerActive !== undefined) {
      taxConfigured = true
    }
  }

  const brandingReady = Boolean(therapist?.invoiceLogoUrl && therapist.invoiceLogoUrl.trim().length > 0)

  const checklist: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Profile 100% complete',
      description: 'All required business and compliance fields are up to date.',
      complete: profileComplete,
    },
    {
      id: 'iban',
      label: 'Austrian IBAN on file',
      description: 'Valid IBAN used for payouts and invoices.',
      complete: ibanValid,
    },
    {
      id: 'tax',
      label: 'Tax compliance configured',
      description: 'VAT or Kleinunternehmer status configured with advisor details.',
      complete: taxConfigured,
    },
    {
      id: 'branding',
      label: 'Invoice branding logo uploaded',
      description: 'Logo appears on invoices for live clients.',
      complete: brandingReady,
    },
  ]

  const canUpgrade = checklist.every((item) => item.complete)

  return {
    checklist,
    canUpgrade,
    profileScore: profileCompletion.score,
  }
}

async function archiveTestData(userId: string, therapistId: string) {
  await prisma.$transaction(async (tx) => {
    const [clients, appointments, appointmentReminders, invoices, payments, notes, services, serviceRateTemplates, products, orders, vouchers, locations, consents] = await Promise.all([
      tx.client.findMany({ where: { therapistId } }),
      tx.appointment.findMany({ where: { therapistId } }),
      tx.appointmentReminder.findMany({ where: { Appointment: { therapistId } } }),
      tx.invoice.findMany({ where: { therapistId } }),
      tx.payment.findMany({ where: { Invoice: { therapistId } } }),
      tx.note.findMany({ where: { therapistId } }),
      tx.service.findMany({ where: { therapistId } }),
      tx.serviceRateTemplate.findMany({ where: { therapistId } }),
      tx.product.findMany({ where: { therapistId } }),
      tx.order.findMany({ where: { therapistId } }),
      tx.voucher.findMany({ where: { therapistId } }),
      tx.location.findMany({ where: { therapistId } }),
      tx.consent.findMany({ where: { therapistId } }),
    ])

    const archivePayload = {
      archivedAt: new Date().toISOString(),
      therapistId,
      clients,
      appointments,
      appointmentReminders,
      invoices,
      payments,
      notes,
      services,
      serviceRateTemplates,
      products,
      orders,
      vouchers,
      locations,
      consents,
    }

    await tx.archivedData.create({
      data: {
        userId,
        data: archivePayload,
        note: 'upgrade-to-production',
      },
    })

    await tx.appointmentReminder.deleteMany({ where: { Appointment: { therapistId } } })
    await tx.payment.deleteMany({ where: { Invoice: { therapistId } } })
    await tx.invoice.deleteMany({ where: { therapistId } })
    await tx.note.deleteMany({ where: { therapistId } })
    await tx.order.deleteMany({ where: { therapistId } })
    await tx.product.deleteMany({ where: { therapistId } })
    await tx.service.deleteMany({ where: { therapistId } })
    await tx.serviceRateTemplate.deleteMany({ where: { therapistId } })
    await tx.voucher.deleteMany({ where: { therapistId } })
    await tx.consent.deleteMany({ where: { therapistId } })
    await tx.appointment.deleteMany({ where: { therapistId } })
    await tx.client.deleteMany({ where: { therapistId } })
    await tx.location.deleteMany({ where: { therapistId } })

    await tx.user.update({
      where: { id: userId },
      data: { accountType: AccountType.PRODUCTION },
    })
  })
}

export async function GET() {
  try {
    const { therapist, user } = await requireTherapist()
    const { checklist, canUpgrade, profileScore } = await buildUpgradeChecklist(therapist.id)

    return NextResponse.json({
      checklist,
      canUpgrade,
      profileScore,
      accountType: user.accountType,
    })
  } catch (error) {
    console.error('[account-upgrade][GET]', error)
    return NextResponse.json({ error: 'Failed to load upgrade readiness' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { therapist, user } = await requireTherapist()

    if (user.accountType !== AccountType.TEST) {
      return NextResponse.json({ error: 'Only test accounts can be upgraded' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    if (!body?.confirmArchive) {
      return NextResponse.json({ error: 'You must confirm that test data will be archived.' }, { status: 400 })
    }

    const { checklist, canUpgrade } = await buildUpgradeChecklist(therapist.id)

    if (!canUpgrade) {
      return NextResponse.json({
        error: 'Upgrade prerequisites not met',
        checklist,
      }, { status: 400 })
    }

    await archiveTestData(user.id, therapist.id)
    await sendUpgradeConfirmationEmail(user.email)

    return NextResponse.json({
      success: true,
      message: 'Account upgraded to production. Please sign in again to continue.',
      forceLogout: true,
    })
  } catch (error) {
    console.error('[account-upgrade][POST]', error)
    return NextResponse.json({ error: 'Failed to upgrade account' }, { status: 500 })
  }
}
