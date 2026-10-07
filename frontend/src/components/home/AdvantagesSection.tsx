import { BadgeCheck, CalendarDays, ClipboardList } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const ADVANTAGES = [
  {
    icon: CalendarDays,
    text: 'Encontre uma grande variedade de eventos',
    bg: 'bg-blue-300',
  },
  {
    icon: ClipboardList,
    text: 'Organize seus eventos com mais confiança',
    bg: 'bg-red-200',
  },
  {
    icon: BadgeCheck,
    text: 'Aproveite todas as vantagens do nosso site',
    bg: 'bg-green-300',
  },
];

export function AdvantagesSection() {
  return (
    <section className='mx-auto max-w-6xl px-5 pb-20 lg:px-8'>
      <div className='mb-10'>
        <SectionHeading
          eyebrow='Por que a Golden'
          title='Faça memórias com a Golden Eventos'
          align='center'
        />
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        {ADVANTAGES.map(({ icon: Icon, text, bg }) => (
          <div
            key={text}
            className='flex items-center gap-4 rounded-xl border border-border bg-card p-6'
          >
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-accent-foreground ${bg}`}
            >
              <Icon className='size-6' />
            </div>
            <p className='font-bold text-foreground'>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
