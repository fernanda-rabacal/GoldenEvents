import { PrismaClient } from "@prisma/client";
import { encryptPassword } from "../../src/helpers/handlePassword";

export async function createUsers(prisma: PrismaClient) {
  await prisma.user.createMany({
    data: [ 
      {
        name: 'Fernanda Rabaçal',
        user_type_id: 1,
        email: 'nandarabacal02@hotmail.com',
        password: await encryptPassword('123456'),
        document: '00000000000',
      },
      {
        name: 'Gabriel Mayan',
        user_type_id: 2,
        email: 'mayan@hotmail.com',
        password: await encryptPassword('123456'),
        document: '11122233344',
      },
    ]
  })
}