import { PrismaClient } from '@prisma/client';
import { createUserTypes } from './createUserTypeSeeder';
import { createEventCategories } from './createEventCategoriesSeeder';
import { createUsers } from './createUsersSeeder';
import { createEvents } from './createEventsSeeder';
import { createPaymentMethods } from './createPaymentMethodsSeeder';

const prisma = new PrismaClient();

async function main() {
  await createUserTypes(prisma);
  await createEventCategories(prisma);
  await createUsers(prisma);
  /* await createEvents(prisma); */
  await createPaymentMethods(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
