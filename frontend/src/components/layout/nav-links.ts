import {
  CalendarPlus,
  ClipboardList,
  House,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { EVENTS_PAGE_PATH } from '@/utils/events_href';

export const ORGANIZER_PATH = '/organizador';
export const MY_EVENTS_PATH = '/organizador/meus-eventos';
export const MY_TICKETS_PATH = '/organizador/minhas-compras';
export const CREATE_EVENT_PATH = '/organizador/eventos/criar';
export const PROFILE_PATH = '/perfil';

export function buildEditEventHref(slug: string) {
  return `/organizador/eventos/editar/${slug}`;
}

export const NAV_LINKS = [
  { label: 'Eventos', href: EVENTS_PAGE_PATH },
  { label: 'Categorias', href: '/#categorias' },
  { label: 'Meus ingressos', href: MY_TICKETS_PATH },
];

export const CREATE_EVENT_LINK = {
  label: 'Crie seu evento',
  href: CREATE_EVENT_PATH,
};

export const USER_MENU_LINKS = [
  { label: 'Perfil', href: PROFILE_PATH },
  { label: 'Área do Produtor', href: ORGANIZER_PATH },
];

export const ADMIN_NAV_LINKS: {
  label: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { label: 'Início', href: ORGANIZER_PATH, icon: House },
  { label: 'Perfil', href: PROFILE_PATH, icon: UserRound },
  { label: 'Criar evento', href: CREATE_EVENT_PATH, icon: CalendarPlus },
  { label: 'Meus eventos', href: MY_EVENTS_PATH, icon: ClipboardList },
  { label: 'Minhas compras', href: MY_TICKETS_PATH, icon: ShoppingBag },
];
