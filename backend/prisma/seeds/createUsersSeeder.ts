import { PrismaClient } from '@prisma/client';
import { encryptData } from '../../src/util/crypt.js';

export async function createUsers(prisma: PrismaClient) {
  const password = await encryptData('123456');

  await prisma.user.createMany({
    data: [
      {
        name: 'Fernanda Rabaçal',
        user_type_id: 1,
        email: 'nandarabacal02@hotmail.com',
        password,
        document: '00000000000',
      },
      {
        name: 'Gabriel Mayan',
        user_type_id: 2,
        email: 'mayan@hotmail.com',
        password,
        document: '11122233344',
      },
    ],
  });
}
