import { PrismaClient } from "@prisma/client";

export async function createUserTypes(prisma: PrismaClient) {
  await prisma.userType.createMany({
    data: [
      { name: 'Admin' },
      { name: 'Usuário' }
    ]
  })
}