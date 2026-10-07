'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/ui/button';

type HorizontalScrollerProps = {
  children: ReactNode;
  className?: string;
};

export function HorizontalScroller({
  children,
  className,
}: HorizontalScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const updateScrollState = () => {
      setCanScrollStart(element.scrollLeft > 0);
      setCanScrollEnd(
        // Zoom do navegador deixa scrollLeft fracionado e nunca bate exato no fim
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      );
    };

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(element);
    element.addEventListener('scroll', updateScrollState, { passive: true });

    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', updateScrollState);
    };
  }, []);

  function scrollBy(direction: 1 | -1) {
    const element = scrollRef.current;

    element?.scrollBy({
      left: direction * element.clientWidth * 0.7,
      behavior: 'smooth',
    });
  }

  const hasOverflow = canScrollStart || canScrollEnd;

  return (
    <div className='flex min-w-0 items-center gap-2'>
      {hasOverflow && (
        <Button
          variant='outline'
          size='icon'
          aria-label='Rolar para o início'
          disabled={!canScrollStart}
          onClick={() => scrollBy(-1)}
          className='rounded-full'
        >
          <ChevronLeft />
        </Button>
      )}

      <div
        ref={scrollRef}
        className={`flex min-w-0 flex-1 scrollbar-none items-center gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden ${className ?? ''}`}
      >
        {children}
      </div>

      {hasOverflow && (
        <Button
          variant='outline'
          size='icon'
          aria-label='Rolar para o final'
          disabled={!canScrollEnd}
          onClick={() => scrollBy(1)}
          className='rounded-full'
        >
          <ChevronRight />
        </Button>
      )}
    </div>
  );
}
