export const NAV_LINKS = [
  { label: 'Eventos', href: '/#eventos' },
  { label: 'Categorias', href: '/#categorias' },
  { label: 'Meus ingressos', href: '/organizador/minhas-compras' },
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
