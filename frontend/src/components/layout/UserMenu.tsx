'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut } from 'lucide-react';
import type { User } from '@golden-events/shared';
import { signOut } from '@/services/auth-actions';
import { Button } from '@/ui/button';
import { getUserMenuLinks } from './nav-links';

type UserMenuProps = {
  user: User;
};

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstName = user.name.split(' ')[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('click', closeOnOutsideClick);
    return () => document.removeEventListener('click', closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className='relative shrink-0'>
      <Button
        variant='outline'
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup='menu'
      >
        {firstName}
        <ChevronDown
          data-icon='inline-end'
          className={`transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div
          role='menu'
          className='absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-popover py-2 text-body-sm text-popover-foreground shadow-lg'
        >
          {getUserMenuLinks(user.id).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role='menuitem'
              onClick={() => setIsOpen(false)}
              className='block px-4 py-2 transition hover:bg-accent'
            >
              {link.label}
            </Link>
          ))}
          <form action={signOut}>
            <button
              type='submit'
              role='menuitem'
              className='flex w-full items-center gap-2 px-4 py-2 text-left text-destructive transition hover:bg-accent'
            >
              <LogOut className='size-4' /> Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
