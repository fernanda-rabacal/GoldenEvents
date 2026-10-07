import Link from 'next/link';
import { ArrowRight, Ticket } from 'lucide-react';
import type { EventCategory } from '@golden-events/shared';
import { buildEventsHref } from '@/utils/events_href';

type CategoryCardProps = {
  category: EventCategory;
  index: number;
};

export function CategoryCard({ category, index }: CategoryCardProps) {
  const iconColors =
    index % 2 ? 'bg-accent text-orange-600' : 'bg-red-100 text-red-700';

  return (
    <Link
      href={buildEventsHref({ categoryId: category.id })}
      className='group rounded-xl border border-border bg-card p-6 text-left transition hover:-translate-y-1 hover:border-ring/60 hover:shadow-lg'
    >
      <div
        className={`mb-8 flex size-12 items-center justify-center rounded-2xl ${iconColors}`}
      >
        {category.photo ? (
          <img src={category.photo} alt='' className='size-8 object-contain' />
        ) : (
          <Ticket className='size-6' />
        )}
      </div>
      <p className='font-black text-foreground'>{category.name}</p>
      <p className='mt-1 text-body-sm text-muted-foreground'>
        Ver experiências{' '}
        <ArrowRight className='ml-1 inline size-3 transition group-hover:translate-x-1' />
      </p>
    </Link>
  );
}
