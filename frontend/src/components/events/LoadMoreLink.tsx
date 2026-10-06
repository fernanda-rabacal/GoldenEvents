import Link from 'next/link';
import { buttonVariants } from '@/ui/button';

export function LoadMoreLink({ href }: { href: string }) {
  return (
    <div className='mt-10 text-center'>
      <Link
        href={href}
        scroll={false}
        className={buttonVariants({ variant: 'outline', size: 'lg' })}
      >
        Carregar mais
      </Link>
    </div>
  );
}
