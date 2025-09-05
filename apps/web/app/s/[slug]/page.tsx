import { notFound } from 'next/navigation'
import { PrismaClient } from '@myoflow/db'

const prisma = new PrismaClient()

interface MiniSitePageProps {
  params: {
    slug: string
  }
}

export default async function MiniSitePage({ params }: MiniSitePageProps) {
  const therapist = await prisma.therapist.findUnique({
    where: { slug: params.slug },
    include: {
      User: true,
      Locations: true,
      Services: {
        where: { active: true },
        orderBy: { category: 'asc' },
      },
      Products: {
        where: { active: true },
      },
    },
  })

  if (!therapist) {
    notFound()
  }

  const brandColor = therapist.brandColor || '#3b82f6'

  return (
    <div className="min-h-screen">
      <style jsx>{`
        :root {
          --brand-color: ${brandColor};
        }
        .brand-bg {
          background-color: var(--brand-color);
        }
        .brand-text {
          color: var(--brand-color);
        }
        .brand-border {
          border-color: var(--brand-color);
        }
      `}</style>

      {/* Hero Section */}
      <section className="brand-bg text-white py-20">
        <div className="container mx-auto px-4 text-center">
          {therapist.logoUrl && (
            <img
              src={therapist.logoUrl}
              alt={therapist.User.name || 'Logo'}
              className="w-20 h-20 rounded-full mx-auto mb-6"
            />
          )}
          <h1 className="text-4xl font-bold mb-4">
            {therapist.User.name}
          </h1>
          <p className="text-xl opacity-90 mb-8">
            {therapist.designation.replace('_', ' ')}
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 brand-text">
            Unsere Leistungen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {therapist.Services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md p-6 border brand-border">
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">
                  Dauer: {service.durationMin} Minuten
                </p>
                <p className="text-2xl font-bold brand-text">
                  €{(service.priceCents / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Termin buchen</h2>
          <p className="text-lg text-gray-600 mb-8">
            Kontaktieren Sie uns für einen Termin
          </p>
          {/* TODO-CLAUDE: Add booking form */}
          <div className="bg-white rounded-lg p-8 max-w-md mx-auto">
            <p className="text-gray-500">
              Buchungsformular wird hier angezeigt
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 brand-text">Kontakt</h2>
          <div className="max-w-2xl mx-auto">
            {therapist.Locations.map((location) => (
              <div key={location.id} className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{location.name}</h3>
                {location.address && (
                  <p className="text-gray-600">{location.address}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="brand-bg text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 {therapist.User.name}</p>
          {/* TODO-CLAUDE: Add Impressum/Datenschutz links from settings */}
        </div>
      </footer>
    </div>
  )
}