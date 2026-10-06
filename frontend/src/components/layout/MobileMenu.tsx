'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import type { User } from '@golden-events/shared';
import { SearchForm } from '@/components/events/SearchForm';
import { signOut } from '@/services/auth-actions';
import { Button } from '@/ui/button';
import { CREATE_EVENT_LINK, NAV_LINKS, USER_MENU_LINKS } from './nav-links';

type MobileMenuProps = {
  user: User | null;
};

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  const links = [
    ...NAV_LINKS,
    CREATE_EVENT_LINK,
    ...(user ? USER_MENU_LINKS : []),
  ];

  return (
    <div className='lg:hidden'>
      <Button
        variant='ghost'
        size='icon-lg'
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls='mobile-menu'
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {isOpen && (
        <div
          id='mobile-menu'
          className='absolute inset-x-0 top-full z-20 border-y border-border bg-background px-5 py-6 shadow-lg'
        >
          <div className='md:hidden'>
            <SearchForm variant='compact' />
          </div>

          <nav className='mt-4 flex flex-col text-body font-medium text-foreground md:mt-0'>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className='rounded-xl px-3 py-3 transition hover:bg-accent'
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <form action={signOut}>
                <button
                  type='submit'
                  className='flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-destructive transition hover:bg-accent'
                >
                  <LogOut className='size-4' /> Sair
                </button>
              </form>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
