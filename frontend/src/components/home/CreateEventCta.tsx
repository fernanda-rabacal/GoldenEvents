import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export function CreateEventCta() {
  return (
    <section
      id='criar'
      className='mx-5 mb-20 overflow-hidden rounded-4xl bg-secondary px-8 py-12 lg:mx-auto lg:max-w-6xl lg:px-16'
    >
      <div className='grid items-center gap-8 lg:grid-cols-[1fr_auto]'>
        <SectionHeading
          eyebrow='Você tem uma ideia?'
          title='Transforme seu evento em uma experiência inesquecível.'
          eyebrowClassName='text-primary'
          titleClassName='max-w-xl'
        />
        <Link
          href='/organizador/eventos/criar'
          className='inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-body-sm font-bold text-primary-foreground transition hover:bg-primary/90'
        >
          Começar agora <ArrowRight className='size-4' />
        </Link>
      </div>
    </section>
  );
}
