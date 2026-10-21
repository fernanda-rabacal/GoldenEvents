import { buttonVariants } from '@/ui/button';
import { AuthDivider } from './AuthDivider';

type GoogleButtonProps = {
  href: string;
};

// Link e não form: o CSP só permite form-action para a própria origem, e a rota redireciona para o Google
export function GoogleButton({ href }: GoogleButtonProps) {
  return (
    <>
      <a
        href={href}
        className={buttonVariants({
          variant: 'outline',
          size: 'lg',
          className: 'w-full gap-3 font-bold',
        })}
      >
        <GoogleIcon />
        Continuar com Google
      </a>
      <AuthDivider label='ou com seu e-mail' className='my-6' />
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' className='size-5'>
      <path
        fill='#4285F4'
        d='M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z'
      />
      <path
        fill='#34A853'
        d='M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z'
      />
      <path
        fill='#FBBC05'
        d='M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z'
      />
      <path
        fill='#EA4335'
        d='M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z'
      />
    </svg>
  );
}
