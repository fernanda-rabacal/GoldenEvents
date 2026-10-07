import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { canManageEvents } from '@golden-events/shared';
import {
  BECOME_ORGANIZER_PATH,
  ORGANIZER_PATH,
  PROFILE_PATH,
} from '@/components/layout/nav-links';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { requireUser } from '@/services/auth';
import { buttonVariants } from '@/ui/button';
import { EVENTS_PAGE_PATH } from '@/utils/events_href';

export const metadata: Metadata = {
  title: 'Perfil',
};

export default async function ProfilePage() {
  const user = await requireUser(PROFILE_PATH);
  const isOrganizer = canManageEvents(user.user_type_id);

  return (
    <main className='mx-auto max-w-6xl px-5 py-8 lg:px-8'>
      <Link
        href={EVENTS_PAGE_PATH}
        className='inline-flex items-center gap-2 text-body-sm font-bold text-muted-foreground transition hover:text-accent-foreground'
      >
        <ArrowLeft className='size-4' /> Voltar para eventos
      </Link>

      <div className='mt-7 mb-8'>
        <p className='text-body-sm font-bold tracking-eyebrow text-orange-500 uppercase'>
          Minha conta
        </p>
        <h1 className='mt-2 text-h2 text-foreground sm:text-h1'>Perfil</h1>
        <p className='mt-2 text-body text-muted-foreground'>
          Atualize seus dados de cadastro.
        </p>
      </div>

      <ProfileForm user={user} />

      <section className='mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-h4 text-foreground'>
            {isOrganizer ? 'Área do organizador' : 'Quer criar eventos?'}
          </h2>
          <p className='mt-1 text-body-sm text-muted-foreground'>
            {isOrganizer
              ? 'Gerencie seus eventos, vendas e público no painel.'
              : 'Torne-se organizador e publique seu primeiro evento na Golden.'}
          </p>
        </div>
        <Link
          href={isOrganizer ? ORGANIZER_PATH : BECOME_ORGANIZER_PATH}
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          {isOrganizer ? 'Ir para o painel' : 'Torne-se organizador'}
          <ArrowRight data-icon='inline-end' />
        </Link>
      </section>
    </main>
  );
}
