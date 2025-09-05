import { PrismaClient } from '@prisma/client'
import { TherapistDesignation, VatStatus, LocationType, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'dev@myoflow.local',
      name: 'Dev User',
      role: Role.OWNER,
    },
  })

  const therapist = await prisma.therapist.create({
    data: {
      userId: user.id,
      slug: 'dev-therapist',
      designation: TherapistDesignation.GEWERBLICHER_MASSEUR,
      vatStatus: VatStatus.KLEINUNTERNEHMER,
      kleinunternehmer: true,
      annualGrossCents: 0,
      brandColor: '#3b82f6',
    },
  })

  await prisma.location.create({
    data: {
      therapistId: therapist.id,
      name: 'Home Practice',
      type: LocationType.HOME,
      address: '1010 Wien, Austria',
      travelBufferMin: 0,
    },
  })

  console.log('Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })