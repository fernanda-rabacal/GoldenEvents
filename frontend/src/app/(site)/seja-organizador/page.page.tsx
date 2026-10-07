import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  QrCode,
  ShoppingBag,
  Ticket,
  UsersRound,
} from 'lucide-react';
import { canManageEvents } from '@golden-events/shared';
import { SectionHeading } from '@/components/home/SectionHeading';
import { CREATE_EVENT_PATH } from '@/components/layout/nav-links';
import { OrganizerCta } from '@/components/organizer/OrganizerCta';
import { getCurrentUser } from '@/services/auth';

export const metadata: Metadata = {
  title: 'Seja organizador',
  description:
    'Crie seus eventos na Golden, venda ingressos e acompanhe seu público em um só painel.',
};

const BENEFITS = [
  {
    icon: CalendarDays,
    title: 'Crie e edite eventos',
    text: 'Publique a página do seu evento com fotos, descrição, local e preço em poucos minutos.',
  },
  {
    icon: ShoppingBag,
    title: 'Acompanhe as vendas',
    text: 'Veja ingressos vendidos, faturamento e pedidos de cada evento em tempo real.',
  },
  {
    icon: UsersRound,
    title: 'Conheça seu público',
    text: 'Entenda quem compra seus ingressos para planejar as próximas edições.',
  },
];

const STEPS = [
  { icon: CalendarDays, text: 'Cadastre seu evento' },
  { icon: Ticket, text: 'Venda ingressos pela Golden' },
  { icon: QrCode, text: 'Receba o público com QR code' },
];

export default async function BecomeOrganizerPage() {
  const user = await getCurrentUser();

  if (user && canManageEvents(user.user_type_id)) {
    redirect(CREATE_EVENT_PATH);
  }

  return (
    <main>
      <section className='mx-auto max-w-6xl px-5 py-8 lg:px-8'>
        <Link
          href='/'
          className='inline-flex items-center gap-2 text-body-sm font-bold text-muted-foreground transition hover:text-accent-foreground'
        >
          <ArrowLeft className='size-4' /> Página inicial
        </Link>

        <div className='mt-10 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]'>
          <div>
            <p className='text-body-sm font-bold tracking-eyebrow text-orange-500 uppercase'>
              Para organizadores
            </p>
            <h1 className='mt-3 text-h2 text-foreground sm:text-display'>
              Transforme sua ideia em um evento inesquecível.
            </h1>
            <p className='mt-5 max-w-xl text-body text-muted-foreground'>
              Na Golden você cria a página do evento, vende ingressos e
              acompanha tudo em um painel feito para quem organiza.
            </p>
            <OrganizerCta user={user} className='mt-8' />
          </div>

          <ol className='flex flex-col gap-3 rounded-4xl bg-secondary p-6 sm:p-8'>
            {STEPS.map(({ icon: Icon, text }, index) => (
              <li
                key={text}
                className='flex items-center gap-4 rounded-2xl bg-card px-5 py-4'
              >
                <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-black text-primary-foreground'>
                  {index + 1}
                </span>
                <span className='flex-1 text-body font-bold text-foreground'>
                  {text}
                </span>
                <Icon className='size-5 text-orange-500' />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-5 py-16 lg:px-8'>
        <SectionHeading
          eyebrow='O que você ganha'
          title='Tudo o que seu evento precisa'
          align='center'
        />
        <div className='mt-10 grid gap-4 md:grid-cols-3'>
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className='rounded-xl border border-border bg-card p-6'
            >
              <span className='flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground'>
                <Icon className='size-5' />
              </span>
              <h3 className='mt-5 text-h4 text-foreground'>{title}</h3>
              <p className='mt-2 text-body-sm text-muted-foreground'>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className='mx-5 mb-20 rounded-4xl bg-accent px-8 py-12 lg:mx-auto lg:max-w-6xl lg:px-16'>
        <div className='grid items-center gap-8 lg:grid-cols-[1fr_auto]'>
          <SectionHeading
            eyebrow='Pronto para começar?'
            title='Seu próximo evento começa aqui.'
            titleClassName='max-w-xl'
          />
          <OrganizerCta user={user} />
        </div>
      </section>
    </main>
  );
}
