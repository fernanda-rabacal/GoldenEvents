'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { User } from '@golden-events/shared';
import {
  ADMIN_NAV_LINKS,
  isAdminNavLinkActive,
} from '@/components/layout/nav-links';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';
import { signOut } from '@/services/auth-actions';
import { Button } from '@/ui/button';

type AdminSidebarProps = {
  user: User;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
};

const itemClassName =
  'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-body-sm font-bold transition';

export function AdminSidebar({
  user,
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id='admin-sidebar'
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card transition-[width,translate] lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        isCollapsed && 'lg:w-20',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-5 py-6',
          isCollapsed && 'lg:justify-center lg:px-3',
        )}
      >
        <div className={cn(isCollapsed && 'lg:hidden')}>
          <Logo />
        </div>
        <Button
          variant='ghost'
          size='icon'
          className='hidden lg:inline-flex'
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          onClick={onToggleCollapse}
        >
          {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <div
        className={cn(
          'mx-3 mb-6 rounded-xl bg-accent px-4 py-4',
          isCollapsed && 'lg:hidden',
        )}
      >
        <p className='text-caption font-bold tracking-eyebrow text-orange-700 uppercase'>
          Área do organizador
        </p>
        <p className='mt-3 truncate text-body font-black text-foreground'>
          {user.name}
        </p>
        <p className='mt-1 truncate text-caption text-muted-foreground'>
          {user.email}
        </p>
      </div>

      <nav className='flex flex-col gap-1 px-3'>
        {ADMIN_NAV_LINKS.map((link) => {
          const { label, href, icon: Icon } = link;
          const isActive = isAdminNavLinkActive(link, pathname);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? label : undefined}
              className={cn(
                itemClassName,
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                isCollapsed && 'lg:justify-center lg:px-3',
              )}
            >
              <Icon className='size-5 shrink-0' />
              <span className={cn(isCollapsed && 'lg:sr-only')}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className='mt-auto flex flex-col gap-1 px-3 py-5'>
        <Link
          href='/'
          title={isCollapsed ? 'Voltar para o site' : undefined}
          className={cn(
            itemClassName,
            'text-foreground/80 hover:bg-muted hover:text-foreground',
            isCollapsed && 'lg:justify-center lg:px-3',
          )}
        >
          <ChevronLeft className='size-5 shrink-0' />
          <span className={cn(isCollapsed && 'lg:sr-only')}>
            Voltar para o site
          </span>
        </Link>
        <form action={signOut}>
          <button
            type='submit'
            title={isCollapsed ? 'Sair da conta' : undefined}
            className={cn(
              itemClassName,
              'text-accent-foreground hover:bg-accent',
              isCollapsed && 'lg:justify-center lg:px-3',
            )}
          >
            <LogOut className='size-5 shrink-0' />
            <span className={cn(isCollapsed && 'lg:sr-only')}>
              Sair da conta
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}
