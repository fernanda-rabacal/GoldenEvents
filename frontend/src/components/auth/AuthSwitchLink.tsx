import Link from 'next/link';

type AuthSwitchLinkProps = {
  question: string;
  label: string;
  href: string;
};

export function AuthSwitchLink({ question, label, href }: AuthSwitchLinkProps) {
  return (
    <>
      <div className='my-7 flex items-center gap-4 text-caption text-muted-foreground/70'>
        <span className='h-px flex-1 bg-border' /> ou{' '}
        <span className='h-px flex-1 bg-border' />
      </div>
      <p className='text-center text-body-sm text-muted-foreground'>
        {question}{' '}
        <Link
          href={href}
          className='font-bold text-accent-foreground hover:text-orange-500'
        >
          {label}
        </Link>
      </p>
    </>
  );
}
