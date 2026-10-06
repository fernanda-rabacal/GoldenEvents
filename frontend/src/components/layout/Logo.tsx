import Link from 'next/link';

type LogoProps = {
  variant?: 'default' | 'inverted';
};

export function Logo({ variant = 'default' }: LogoProps) {
  const isInverted = variant === 'inverted';

  return (
    <Link
      href='/'
      className={`shrink-0 text-2xl font-black tracking-tighter ${isInverted ? 'text-secondary' : 'text-accent-foreground'}`}
    >
      Golden
      <span className={isInverted ? 'text-white' : 'text-secondary'}>.</span>
    </Link>
  );
}
