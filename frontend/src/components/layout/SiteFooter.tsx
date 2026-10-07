import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/ui/button';
import { Logo } from './Logo';
import { BECOME_ORGANIZER_PATH } from './nav-links';

const FOOTER_COLUMNS = [
  {
    title: 'Golden',
    links: [
      { label: 'Encontrar eventos', href: '/#eventos' },
      { label: 'Criar evento', href: BECOME_ORGANIZER_PATH },
      { label: 'Categorias', href: '/#categorias' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { label: 'Sobre nós', href: '#sobre' },
      { label: 'Contato', href: '#sobre' },
      { label: 'Termos de uso', href: '#sobre' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer id='sobre' className='bg-red-900 px-5 py-12 text-white lg:px-8'>
      <div className='mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]'>
        <div>
          <Logo variant='inverted' />
          <p className='mt-4 max-w-xs text-body-sm leading-6 text-white/60'>
            A gente acredita que os melhores momentos começam com um simples
            &quot;vamos?&quot;
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <p className='font-bold'>{column.title}</p>
            <div className='mt-4 flex flex-col gap-3 text-body-sm text-white/60'>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className='transition hover:text-white'
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <NewsletterForm />
      </div>

      <div className='mx-auto mt-10 max-w-6xl border-t border-white/15 pt-6 text-center text-caption text-white/40'>
        © {new Date().getFullYear()} Golden Eventos. Feito para viver mais.
      </div>
    </footer>
  );
}

// Ainda não existe endpoint de newsletter na API
function NewsletterForm() {
  return (
    <div>
      <p className='font-bold'>Receba novidades</p>
      <p className='mt-4 text-body-sm leading-6 text-white/60'>
        Eventos e experiências direto no seu e-mail.
      </p>
      <div className='mt-4 flex rounded-lg bg-white p-1'>
        <input
          type='email'
          aria-label='Seu e-mail'
          placeholder='seu@email.com'
          className='min-w-0 flex-1 bg-transparent px-3 text-body-sm text-foreground outline-none'
        />
        <Button
          type='button'
          variant='secondary'
          size='icon'
          aria-label='Inscrever-se'
        >
          <Check />
        </Button>
      </div>
    </div>
  );
}
