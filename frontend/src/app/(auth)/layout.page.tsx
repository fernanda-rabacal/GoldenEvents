import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

const BRAND_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className='min-h-screen bg-background text-foreground'>
      <div className='grid min-h-screen lg:grid-cols-[.9fr_1.1fr]'>
        <section className='relative hidden overflow-hidden bg-red-900 p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between xl:p-14'>
          <div className='relative z-10 w-fit'>
            <Logo variant='inverted' />
          </div>
          <img
            src={BRAND_IMAGE}
            alt=''
            className='absolute inset-0 size-full object-cover opacity-55'
          />
          <div className='absolute inset-0 bg-linear-to-t from-red-900 via-red-900/55 to-red-900/20' />
          <div className='relative z-10 max-w-md'>
            <div className='mb-5 flex size-12 items-center justify-center rounded-2xl bg-secondary text-red-900'>
              <CalendarDays className='size-6' />
            </div>
            <p className='mb-3 text-body-sm font-bold tracking-eyebrow text-orange-300 uppercase'>
              Seu próximo momento começa aqui
            </p>
            <h1 className='text-h1 xl:text-5xl'>
              Descubra eventos que combinam com você.
            </h1>
            <p className='mt-5 text-body leading-7 text-white/70'>
              Salve seus eventos favoritos, acompanhe seus ingressos e não perca
              nenhuma experiência especial.
            </p>
          </div>
          <p className='relative z-10 text-caption text-white/50'>
            Golden Eventos · Viva mais histórias
          </p>
        </section>

        <section className='flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 xl:px-24'>
          <div className='flex items-center justify-between lg:justify-end'>
            <div className='lg:hidden'>
              <Logo />
            </div>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-body-sm font-bold text-muted-foreground transition hover:text-accent-foreground'
            >
              <ArrowLeft className='size-4' /> Voltar para eventos
            </Link>
          </div>

          <div className='mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12'>
            {children}
          </div>

          <p className='text-center text-caption leading-5 text-muted-foreground/70'>
            Ao continuar, você concorda com nossos{' '}
            <a href='#termos' className='underline'>
              Termos de uso
            </a>{' '}
            e{' '}
            <a href='#privacidade' className='underline'>
              Política de privacidade
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
