'use client';

import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import type { User } from '@golden-events/shared';
import { UserMenu } from '@/components/layout/UserMenu';
import { Button } from '@/ui/button';
import { AdminSidebar } from './AdminSidebar';

type AdminShellProps = {
  user: User;
  children: ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className='flex min-h-screen'>
      <AdminSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() =>
          setIsSidebarCollapsed((collapsed) => !collapsed)
        }
        onNavigate={closeSidebar}
      />

      {isSidebarOpen && (
        <div
          aria-hidden
          onClick={closeSidebar}
          className='fixed inset-0 z-30 bg-foreground/30 lg:hidden'
        />
      )}

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex items-center gap-4 border-b border-border bg-card px-5 py-4 lg:px-8'>
          <Button
            variant='ghost'
            size='icon-lg'
            className='lg:hidden'
            aria-label='Abrir menu'
            aria-controls='admin-sidebar'
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu />
          </Button>
          <div className='ml-auto'>
            <UserMenu user={user} />
          </div>
        </header>

        <main className='flex-1 px-5 py-8 lg:px-10'>{children}</main>
      </div>
    </div>
  );
}
