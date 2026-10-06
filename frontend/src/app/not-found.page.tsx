import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404',
};

export default function NotFound() {
  return (
    <main className='flex items-center justify-center gap-20 px-20 py-8 text-center'>
      <div>
        <h1 className='text-9xl font-black text-orange-500'>404</h1>
        <p className='mb-12 text-3xl'>
          Oops... parece que esta rota não foi encontrada
        </p>
        <Link
          href='/'
          className='inline-block rounded-sm bg-red-800 px-8 py-2.5 text-white'
        >
          Voltar para o início
        </Link>
      </div>

      <img
        src='/images/20.svg'
        alt='Sad animated woman looking to a withered flower'
        className='hidden w-1/3 md:block'
      />
    </main>
  );
}
