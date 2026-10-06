import type { EventCategory } from '@golden-events/shared';
import { CategoryCard } from '@/components/events/CategoryCard';
import { SectionHeading } from './SectionHeading';

type CategoriesSectionProps = {
  categories: EventCategory[];
};

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section id='categorias' className='mx-auto max-w-6xl px-5 py-20 lg:px-8'>
      <div className='mb-10'>
        <SectionHeading
          eyebrow='Do seu jeito'
          title='Explore por categoria'
          align='center'
        />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {categories.map((category, index) => (
          <CategoryCard key={category.id} category={category} index={index} />
        ))}
      </div>
    </section>
  );
}
