import Link from 'next/link';
import type { EventCategory } from '@golden-events/shared';
import { buttonVariants } from '@/ui/button';

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
    <div className='flex items-center gap-2 overflow-x-auto pb-1 text-muted-foreground'>
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
    </div>
  );
}
