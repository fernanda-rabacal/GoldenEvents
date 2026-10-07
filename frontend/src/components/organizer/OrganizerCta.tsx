import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { User } from '@golden-events/shared';
import { BECOME_ORGANIZER_PATH } from '@/components/layout/nav-links';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/ui/button';
import { buildLoginHref } from '@/utils/auth_redirect';
import { BecomeOrganizerButton } from './BecomeOrganizerButton';

const REGISTER_AS_ORGANIZER_PATH = '/cadastro?organizador=1';

type OrganizerCtaProps = {
  user: User | null;
  className?: string;
};

export function OrganizerCta({ user, className }: OrganizerCtaProps) {
  if (user) {
    return (
      <div className={className}>
        <BecomeOrganizerButton />
        <p className='mt-3 text-caption text-muted-foreground'>
          Sua conta continua a mesma: seus ingressos não mudam.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Link
        href={REGISTER_AS_ORGANIZER_PATH}
        className={cn(
          buttonVariants({ size: 'lg' }),
          'h-11 px-5 text-body-sm font-bold',
        )}
      >
        Criar conta de organizador <ArrowRight data-icon='inline-end' />
      </Link>
      <p className='mt-3 text-caption text-muted-foreground'>
        Já tem conta?{' '}
        <Link
          href={buildLoginHref(BECOME_ORGANIZER_PATH)}
          className='font-bold text-accent-foreground hover:underline'
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
