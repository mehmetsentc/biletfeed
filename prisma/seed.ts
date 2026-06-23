import { PrismaClient, UserRole } from '@prisma/client';
import { categories, cities } from '../lib/data/mock-events';
import { CATEGORY_IMAGES } from '../lib/data/category-images';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reference data (cities + categories only)...');

  for (const city of cities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: {
        slug: city.slug,
        name: city.name,
        image: city.image,
        eventCount: 0
      },
      update: {
        name: city.name,
        image: city.image
      }
    });
  }

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        image: cat.image,
        eventCount: 0
      },
      update: {
        name: cat.name,
        icon: cat.icon,
        image: cat.image
      }
    });
  }

  for (const [slug, image] of Object.entries(CATEGORY_IMAGES)) {
    await prisma.category.updateMany({
      where: { slug },
      data: { image }
    });
  }

  await prisma.user.upsert({
    where: { firebaseUid: 'seed-system-user' },
    create: {
      firebaseUid: 'seed-system-user',
      email: 'seed@biletfeed.local',
      displayName: 'Bilet Feed Seed',
      role: UserRole.ROLE_SUPER_ADMIN
    },
    update: {}
  });

  console.log(`Seeded ${cities.length} cities, ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
