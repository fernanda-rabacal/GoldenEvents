import {
  CalendarDays,
  LayoutGrid,
  ShoppingBag,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { canManageEvents, type User } from '@golden-events/shared';
import { EVENTS_PAGE_PATH } from '@/utils/events_href';

export const ORGANIZER_PATH = '/organizador';
export const MY_EVENTS_PATH = '/organizador/meus-eventos';
export const TICKET_SALES_PATH = '/organizador/ingressos-e-vendas';
export const AUDIENCE_PATH = '/organizador/publico';
export const CREATE_EVENT_PATH = '/organizador/eventos/criar';
export const MY_TICKETS_PATH = '/meus-ingressos';
export const PROFILE_PATH = '/perfil';
export const BECOME_ORGANIZER_PATH = '/seja-organizador';

export function buildEditEventHref(slug: string) {
  return `/organizador/eventos/editar/${slug}`;
}

export const NAV_LINKS = [
  { label: 'Eventos', href: EVENTS_PAGE_PATH },
  { label: 'Categorias', href: '/#categorias' },
  { label: 'Meus ingressos', href: MY_TICKETS_PATH },
];

// A landing manda quem já organiza direto para o formulário
export const CREATE_EVENT_LINK = {
  label: 'Crie seu evento',
  href: BECOME_ORGANIZER_PATH,
};

export function getUserMenuLinks(user: User) {
  return [
    ...(canManageEvents(user.user_type_id)
      ? [{ label: 'Painel do organizador', href: ORGANIZER_PATH }]
      : []),
    { label: 'Meus ingressos', href: MY_TICKETS_PATH },
    { label: 'Perfil', href: PROFILE_PATH },
  ];
}

type AdminNavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  // Rotas que não estão no menu, mas pertencem a esta aba
  activePrefixes?: string[];
};

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { label: 'Visão geral', href: ORGANIZER_PATH, icon: LayoutGrid },
  {
    label: 'Meus eventos',
    href: MY_EVENTS_PATH,
    icon: CalendarDays,
    activePrefixes: ['/organizador/eventos'],
  },
  { label: 'Ingressos e vendas', href: TICKET_SALES_PATH, icon: ShoppingBag },
  { label: 'Público', href: AUDIENCE_PATH, icon: UsersRound },
];

export function isAdminNavLinkActive(link: AdminNavLink, pathname: string) {
  return (
    pathname === link.href ||
    (link.activePrefixes ?? []).some((prefix) => pathname.startsWith(prefix))
  );
}
