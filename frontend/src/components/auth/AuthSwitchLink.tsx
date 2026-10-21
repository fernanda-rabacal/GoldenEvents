import Link from 'next/link';
import { AuthDivider } from './AuthDivider';

type AuthSwitchLinkProps = {
  question: string;
  label: string;
  href: string;
};

export function AuthSwitchLink({ question, label, href }: AuthSwitchLinkProps) {
  return (
    <>
      <AuthDivider label='ou' />
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
