import { NextResponse } from 'next/server'
import { PrismaClient } from '@myoflow/db'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // For MVP, we'll skip admin auth check here and rely on client-side verification
    // In production this should have proper server-side admin session validation

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
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}