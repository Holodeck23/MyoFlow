import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const user = await prisma.user.create({
    data: {
      email: 'dev@myoflow.local',
      name: 'Dev User',
      role: 'OWNER',
      Therapist: {
        create: {
          slug: 'dev-therapist',
          designation: 'HEILMASSEUR',
          vatStatus: 'KLEINUNTERNEHMER',
          kleinunternehmer: true,
          Locations: {
            create: {
              name: 'Main Practice',
              type: 'HOME',
              address: '123 Muscle Lane, 1010 Vienna, Austria',
            },
          },
        },
      },
    },
  });

  console.log(`Created user with id: ${user.id}`);
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

