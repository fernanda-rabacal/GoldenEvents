import Link from 'next/link';
import { SearchForm } from '@/components/events/SearchForm';
import { getCurrentUser } from '@/services/auth';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { CREATE_EVENT_LINK, NAV_LINKS } from './nav-links';
import { UserMenu } from './UserMenu';

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className='relative mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-4 lg:px-8'>
      <Logo />

      <div className='hidden max-w-sm flex-1 md:block'>
        <SearchForm variant='compact' />
      </div>

      <nav className='ml-auto hidden items-center gap-6 text-body-sm font-medium text-muted-foreground lg:flex'>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className='transition hover:text-accent-foreground'
          >
            {link.label}
          </Link>
        ))}
        <Link
          href={CREATE_EVENT_LINK.href}
          className='font-bold text-accent-foreground transition hover:text-orange-500'
        >
          {CREATE_EVENT_LINK.label}
        </Link>
      </nav>

      <div className='ml-auto flex items-center gap-2 lg:ml-0'>
        {user ? (
          <UserMenu user={user} />
        ) : (
          <Link
            href='/login'
            className='shrink-0 rounded-full border border-secondary px-5 py-2 text-body-sm font-bold text-accent-foreground transition hover:bg-secondary hover:text-white'
          >
            Entrar
          </Link>
        )}
        <MobileMenu user={user} />
      </div>
    </header>
  );
}
