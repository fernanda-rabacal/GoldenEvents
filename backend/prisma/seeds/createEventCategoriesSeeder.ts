import { PrismaClient } from '@prisma/client';

export async function createEventCategories(prisma: PrismaClient) {
  await prisma.eventCategory.createMany({
    data: [
      {
        name: 'Festas e Shows',
        photo: 'https://images.sympla.com.br/651596056d6be.png',
      },
      {
        name: 'Teatros e Espetáculos',
        photo: 'https://images.sympla.com.br/6515956ba5b11.png',
      },
      {
        name: 'Congressos e Palestras',
        photo: 'https://images.sympla.com.br/6515934b35c6e.png',
      },
      {
        name: 'Passeios e Tours',
        photo: 'https://images.sympla.com.br/651594a38adf5.png',
      },
      {
        name: 'Infantil',
        photo: 'https://images.sympla.com.br/6515948258143.png',
      },
      {
        name: 'Cursos e Workshops',
        photo: 'https://images.sympla.com.br/651593b284186.png',
      },
      {
        name: 'Esportes',
        photo: 'https://images.sympla.com.br/651593e03c77e.png',
      },
      {
        name: 'Gastronomia',
        photo: 'https://images.sympla.com.br/6515942bca2c8.png',
      },
      {
        name: 'Eventos Online',
        photo: 'https://images.sympla.com.br/6515940a38c2a.png',
      },
      {
        name: 'Stand Up Comedy',
        photo: 'https://images.sympla.com.br/65159534a23f0.png',
      },
      {
        name: 'Religião e Espiritualidade',
        photo: 'https://images.sympla.com.br/651594f401e62.png',
      },
      {
        name: 'Tecnologia',
        photo: 'https://images.sympla.com.br/6515958ba05ca.png',
      },
    ],
  });
}
