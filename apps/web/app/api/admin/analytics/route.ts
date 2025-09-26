import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { withAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, adminUser) => {

    // Get current date info
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentYear = new Date(now.getFullYear(), 0, 1)

    // Aggregate revenue data
    const [
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      yearlyRevenue,
      totalInvoices,
      paidInvoices,
      totalTherapists,
      activeTherapists
    ] = await Promise.all([
      // Total revenue (all time)
      prisma.invoice.aggregate({
        where: { status: { not: 'VOID' } },
        _sum: { totalGrossCents: true },
        _count: true
      }),

      // Current month revenue
      prisma.invoice.aggregate({
        where: {
          status: { not: 'VOID' },
          createdAt: { gte: currentMonth }
        },
        _sum: { totalGrossCents: true },
        _count: true
      }),

      // Last month revenue
      prisma.invoice.aggregate({
        where: {
          status: { not: 'VOID' },
          createdAt: {
            gte: lastMonth,
            lt: currentMonth
          }
        },
        _sum: { totalGrossCents: true },
        _count: true
      }),

      // Current year revenue
      prisma.invoice.aggregate({
        where: {
          status: { not: 'VOID' },
          createdAt: { gte: currentYear }
        },
        _sum: { totalGrossCents: true },
        _count: true
      }),

      // Total invoices count
      prisma.invoice.count(),

      // Paid invoices count
      prisma.invoice.count({
        where: { status: 'PAID' }
      }),

      // Total therapists count
      prisma.user.count({
        where: { role: { not: { in: ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'] } } }
      }),

      // Active therapists (have at least one invoice)
      prisma.user.count({
        where: {
          role: { not: { in: ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'] } },
          Therapist: {
            Invoices: { some: {} }
          }
        }
      })
    ])

    // Calculate month-over-month growth
    const currentMonthAmount = monthlyRevenue._sum.totalGrossCents || 0
    const lastMonthAmount = lastMonthRevenue._sum.totalGrossCents || 0
    const monthGrowth = lastMonthAmount > 0
      ? ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
      : 0

    // Get top therapists by revenue
    const topTherapists = await prisma.therapist.findMany({
      select: {
        id: true,
        User: {
          select: {
            name: true,
            email: true
          }
        },
        businessName: true,
        Invoices: {
          where: { status: { not: 'VOID' } },
          select: {
            totalGrossCents: true
          }
        }
      },
      take: 5
    })

    const topTherapistsWithRevenue = topTherapists
      .map(therapist => ({
        id: therapist.id,
        name: therapist.User.name || therapist.businessName || 'Unnamed',
        email: therapist.User.email,
        totalRevenue: therapist.Invoices.reduce((sum, invoice) => sum + invoice.totalGrossCents, 0),
        invoiceCount: therapist.Invoices.length
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)

    // Monthly revenue trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const monthData = await prisma.invoice.aggregate({
        where: {
          status: { not: 'VOID' },
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: { totalGrossCents: true },
        _count: true
      })

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('de-AT', { month: 'short', year: 'numeric' }),
        revenue: monthData._sum.totalGrossCents || 0,
        invoices: monthData._count || 0
      })
    }

    const analytics = {
      totalRevenue: {
        amount: totalRevenue._sum.totalGrossCents || 0,
        count: totalRevenue._count || 0
      },
      monthlyRevenue: {
        amount: currentMonthAmount,
        count: monthlyRevenue._count || 0,
        growth: Math.round(monthGrowth * 100) / 100
      },
      yearlyRevenue: {
        amount: yearlyRevenue._sum.totalGrossCents || 0,
        count: yearlyRevenue._count || 0
      },
      invoiceStats: {
        total: totalInvoices,
        paid: paidInvoices,
        paidPercentage: totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0
      },
      therapistStats: {
        total: totalTherapists,
        active: activeTherapists,
        activePercentage: totalTherapists > 0 ? Math.round((activeTherapists / totalTherapists) * 100) : 0
      },
      topTherapists: topTherapistsWithRevenue,
      monthlyTrend
    }

    return NextResponse.json(analytics)
  })
}