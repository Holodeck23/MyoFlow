import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { withAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, adminUser) => {

    // Fetch dashboard stats
    const [totalTherapists, monthlyRevenue, totalInvoices] = await Promise.all([
      prisma.user.count({
        where: { role: { not: { in: ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'] } } }
      }),
      prisma.invoice.aggregate({
        where: {
          status: { not: 'VOID' },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalGrossCents: true }
      }),
      prisma.invoice.count()
    ])

    return NextResponse.json({
      totalTherapists,
      monthlyRevenue: monthlyRevenue._sum.totalGrossCents || 0,
      totalInvoices
    })
  })
}