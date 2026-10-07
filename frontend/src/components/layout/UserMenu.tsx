'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut } from 'lucide-react';
import type { User } from '@golden-events/shared';
import { cn } from '@/lib/utils';
import { signOut } from '@/services/auth-actions';
import { Button } from '@/ui/button';
import { getInitials, USER_TYPE_LABELS } from '@/utils/user_profile';
import { getUserMenuLinks } from './nav-links';

type UserMenuProps = {
  user: User;
  variant?: 'compact' | 'profile';
};

export function UserMenu({ user, variant = 'compact' }: UserMenuProps) {
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

  const chevron = (
    <ChevronDown
      data-icon='inline-end'
      className={cn('transition', isOpen && 'rotate-180')}
    />
  );

  return (
    <div ref={containerRef} className='relative shrink-0'>
      {variant === 'profile' ? (
        <button
          type='button'
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup='menu'
          className='flex items-center gap-3 rounded-xl py-1 pr-1 pl-2 text-left transition outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'
        >
          <span className='hidden text-right sm:block'>
            <span className='block text-body-sm font-black text-foreground'>
              {user.name}
            </span>
            <span className='block text-caption text-muted-foreground'>
              {USER_TYPE_LABELS[user.user_type_id]}
            </span>
          </span>
          <span
            aria-hidden
            className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-black text-primary-foreground'
          >
            {getInitials(user.name)}
          </span>
          <span className='sr-only sm:hidden'>{user.name}</span>
          <span className='text-muted-foreground [&_svg]:size-4'>
            {chevron}
          </span>
        </button>
      ) : (
        <Button
          variant='outline'
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup='menu'
        >
          {firstName}
          {chevron}
        </Button>
      )}

      {isOpen && (
        <div
          role='menu'
          className='absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-popover py-2 text-body-sm text-popover-foreground shadow-lg'
        >
          {getUserMenuLinks(user).map((link) => (
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
              <LogOut className='size-4' /> Sair da conta
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
