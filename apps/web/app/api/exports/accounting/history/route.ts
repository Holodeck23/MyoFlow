import { NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { handleAuthErrors, requireTherapist } from '@/lib/shared-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()

    const logs = await prisma.exportLog.findMany({
      where: { therapistId: therapist.id },
      orderBy: { exportedAt: 'desc' },
      take: 10,
      include: {
        Configuration: {
          select: { configurationName: true }
        }
      }
    })

    const history = logs.map(log => ({
      id: log.id,
      targetSystem: log.targetSystem,
      exportType: log.exportType,
      exportedAt: log.exportedAt.toISOString(),
      dateRangeStart: log.dateRangeStart.toISOString(),
      dateRangeEnd: log.dateRangeEnd.toISOString(),
      invoiceCount: log.invoiceCount,
      totalRevenueCents: log.totalRevenueCents,
      downloadCount: log.downloadCount,
      lastDownloadAt: log.lastDownloadAt ? log.lastDownloadAt.toISOString() : null,
      fileName: log.fileName,
      configurationName: log.Configuration?.configurationName ?? null
    }))

    return NextResponse.json(
      {
        success: true,
        data: history
      },
      { status: 200 }
    )
  })
}
