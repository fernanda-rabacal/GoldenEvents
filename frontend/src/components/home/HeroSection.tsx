import Link from 'next/link';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import type { Event } from '@golden-events/shared';
import { FeaturedEventCard } from './FeaturedEventCard';
import { SearchForm } from '@/components/events/SearchForm';
import { buttonVariants } from '@/ui/button';

type HeroSectionProps = {
  featuredEvent?: Event;
};

export function HeroSection({ featuredEvent }: HeroSectionProps) {
  return (
    <section
      id='top'
      className='mx-auto max-w-6xl px-5 pt-8 pb-20 lg:px-8 lg:pt-16'
    >
      <div className='grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]'>
        <div>
          <div className='mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-caption font-bold tracking-eyebrow text-accent-foreground uppercase'>
            <Sparkles className='size-4' /> experiências que ficam
          </div>

          <h1 className='max-w-xl text-display text-foreground sm:text-6xl lg:text-7xl'>
            Encontre o seu próximo{' '}
            <span className='text-orange-500'>momento.</span>
          </h1>

          <p className='mt-6 max-w-lg text-lg leading-8 text-muted-foreground'>
            Eventos para todos os gostos, em um só lugar. Descubra, conecte-se e
            viva histórias que merecem ser lembradas.
          </p>

          <SearchForm variant='hero' />

          <div className='mt-9 flex flex-wrap gap-4'>
            <Link href='#eventos' className={buttonVariants({ size: 'lg' })}>
              Explorar eventos <ArrowRight data-icon='inline-end' />
            </Link>
            <Link
              href='/organizador/eventos/criar'
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              Criar um evento
            </Link>
          </div>

          <p className='mt-10 flex items-center gap-3 text-body-sm text-muted-foreground'>
            <span className='flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground'>
              <Users className='size-4' />
            </span>
            <span>
              <strong className='text-foreground'>+2.000</strong> pessoas já
              descobriram algo novo
            </span>
          </p>
        </div>

        <FeaturedEventCard event={featuredEvent} />
      </div>
    </section>
  );
}
