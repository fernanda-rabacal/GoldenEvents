import { EVENTS_PAGE_PATH } from '@/utils/events_href';

export const MY_TICKETS_PATH = '/organizador/minhas-compras';

export const NAV_LINKS = [
  { label: 'Eventos', href: EVENTS_PAGE_PATH },
  { label: 'Categorias', href: '/#categorias' },
  { label: 'Meus ingressos', href: MY_TICKETS_PATH },
];

export const CREATE_EVENT_LINK = {
  label: 'Crie seu evento',
  href: '/organizador/eventos/criar',
};

export function getUserMenuLinks(userId: number) {
  return [
    { label: 'Perfil', href: `/perfil/${userId}` },
    { label: 'Área do Produtor', href: '/organizador' },
  ];
}
