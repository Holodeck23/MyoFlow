import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@myoflow/ui'
import { PrismaClient } from '@myoflow/db'
import { formatCurrency, KLEINUNTERNEHMER_LIMIT } from '@myoflow/lib'

const prisma = new PrismaClient()

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.therapistId) {
    redirect('/auth/sign-in')
  }

  // Fetch dashboard data
  const therapist = await prisma.therapist.findUnique({
    where: { id: session.user.therapistId },
    include: {
      Invoices: {
        where: {
          status: 'PAID',
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1), // Start of current year
          },
        },
      },
      Appointments: {
        where: {
          start: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
          },
        },
      },
    },
  })

  if (!therapist) {
    redirect('/auth/sign-in')
  }

  const monthlyRevenue = therapist.Invoices.reduce((sum, invoice) => {
    const invoiceMonth = invoice.createdAt.getMonth()
    const currentMonth = new Date().getMonth()
    return invoiceMonth === currentMonth ? sum + invoice.totalGrossCents : sum
  }, 0)

  const monthlyBookings = therapist.Appointments.length
  const annualProgress = (therapist.annualGrossCents / KLEINUNTERNEHMER_LIMIT) * 100

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Umsatz (Monat)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Buchungen (Monat)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kleinunternehmergrenze
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {annualProgress.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {formatCurrency(therapist.annualGrossCents)} / {formatCurrency(KLEINUNTERNEHMER_LIMIT)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min(annualProgress, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Willkommen bei MyoFlow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ihre sichere Praxisverwaltung für österreichische Therapeuten.
          </p>
          {/* TODO-CLAUDE: Add navigation to different sections */}
        </CardContent>
      </Card>
    </div>
  )
}