import Link from 'next/link';
import type { EventCategory } from '@golden-events/shared';
import { buildEventsHref } from '@/utils/events_href';

type CategoryFilterProps = {
  categories: EventCategory[];
  activeCategoryId?: number;
  query?: string;
};

const chipClassName = 'whitespace-nowrap rounded-full px-4 py-2 transition';
const activeChipClassName = 'bg-primary text-primary-foreground';
const inactiveChipClassName = 'hover:bg-accent';

export function CategoryFilter({
  categories,
  activeCategoryId,
  query,
}: CategoryFilterProps) {
  const options = [
    { id: undefined, name: 'Todos' },
    ...categories.map(({ id, name }) => ({ id, name })),
  ];

  return (
    <div className='flex items-center gap-3 overflow-x-auto pb-1 text-body-sm font-bold text-muted-foreground'>
      {options.map((option) => {
        const isActive = option.id === activeCategoryId;

        return (
          <Link
            key={option.id ?? 'todos'}
            href={buildEventsHref({ query, categoryId: option.id })}
            aria-current={isActive ? 'page' : undefined}
            className={`${chipClassName} ${isActive ? activeChipClassName : inactiveChipClassName}`}
          >
            {option.name}
          </Link>
        );
      })}
    </div>
  );
}
