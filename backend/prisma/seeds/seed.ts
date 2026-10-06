import { PrismaClient } from '@prisma/client';
import { createUserTypes } from './createUserTypeSeeder.js';
import { createEventCategories } from './createEventCategoriesSeeder.js';
import { createUsers } from './createUsersSeeder.js';
import { createEvents } from './createEventsSeeder.js';
import { createPaymentMethods } from './createPaymentMethodsSeeder.js';

const prisma = new PrismaClient();

async function main() {
  await createUserTypes(prisma);
  await createEventCategories(prisma);
  await createUsers(prisma);
  // Os testes E2E esperam o banco sem eventos
  if (process.env.NODE_ENV !== 'test') {
    await createEvents(prisma);
  }
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
