import Link from 'next/link';
import type { EventCategory } from '@golden-events/shared';
import { buttonVariants } from '@/ui/button';
import { HorizontalScroller } from './HorizontalScroller';

type CategoryFilterProps = {
  categories: EventCategory[];
  activeCategoryId?: number;
  getHref: (categoryId?: number) => string;
  inactiveVariant?: 'ghost' | 'outline';
};

export function CategoryFilter({
  categories,
  activeCategoryId,
  getHref,
  inactiveVariant = 'ghost',
}: CategoryFilterProps) {
  const options = [
    { id: undefined, name: 'Todos' },
    ...categories.map(({ id, name }) => ({ id, name })),
  ];

  return (
    <HorizontalScroller className='text-muted-foreground'>
      {options.map((option) => {
        const isActive = option.id === activeCategoryId;

        return (
          <Link
            key={option.id ?? 'todos'}
            href={getHref(option.id)}
            aria-current={isActive ? 'page' : undefined}
            className={buttonVariants({
              variant: isActive ? 'default' : inactiveVariant,
            })}
          >
            {option.name}
          </Link>
        );
      })}
    </HorizontalScroller>
  );
}
