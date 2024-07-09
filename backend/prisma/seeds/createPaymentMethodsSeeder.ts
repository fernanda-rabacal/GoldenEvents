import { PrismaClient } from '@prisma/client';

export async function createPaymentMethods(prisma: PrismaClient) {
  await prisma.paymentMethod.createMany({
    data: [{ name: 'Boleto' }, { name: 'Pix' }, { name: 'Cartão de Crédito' }],
  });
}
