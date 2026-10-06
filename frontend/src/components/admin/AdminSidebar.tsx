'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ADMIN_NAV_LINKS } from '@/components/layout/nav-links';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';

type AdminSidebarProps = {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
};

export function AdminSidebar({
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
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-[width,translate] lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        isCollapsed && 'lg:w-20',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-5 py-5',
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

      <nav className='flex flex-col gap-1 px-3'>
        {ADMIN_NAV_LINKS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-bold transition',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && 'lg:justify-center',
              )}
            >
              <Icon className='size-5 shrink-0' />
              <span className={cn(isCollapsed && 'lg:sr-only')}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className='mt-auto px-3 py-5'>
        <Link
          href='/'
          title={isCollapsed ? 'Voltar para o site' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground',
            isCollapsed && 'lg:justify-center',
          )}
        >
          <ArrowLeft className='size-5 shrink-0' />
          <span className={cn(isCollapsed && 'lg:sr-only')}>
            Voltar para o site
          </span>
        </Link>
      </div>
    </aside>
  );
}
