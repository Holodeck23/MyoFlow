import { prisma } from '@myoflow/db'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { verifyIntakeToken } from '@/lib/intake'

export default async function IntakePage({ params }: { params: { token: string } }) {
  const data = verifyIntakeToken(params.token)
  if (!data) notFound()

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, therapistId: data.therapistId },
    include: { Consents: { orderBy: { acceptedAt: 'desc' }, take: 1 } },
  })
  if (!client) notFound()

  const latest = client.Consents[0]
  if (latest) {
    const ip = headers().get('x-forwarded-for') || headers().get('x-real-ip') || ''
    await prisma.auditLog.create({
      data: {
        therapistId: data.therapistId,
        entity: 'Consent',
        entityId: latest.id,
        action: 'read',
        ip,
      },
    })
  }

  return (
    <div>
      <h1>Welcome {client.firstName} {client.lastName}</h1>
    </div>
  )
}
