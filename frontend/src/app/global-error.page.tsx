'use client';

import {
  ErrorContent,
  type ErrorPageProps,
} from '@/components/layout/ErrorContent';
import './globals.css';

// Substitui o layout raiz quando ele quebra, por isso traz o próprio <html> e o CSS global
export default function GlobalError({ error, retry }: ErrorPageProps) {
  return (
    <html lang='pt-BR'>
      <body className='antialiased'>
        <title>Erro | Golden Eventos</title>
        <main className='flex min-h-screen items-center justify-center'>
          <ErrorContent
            digest={error.digest}
            retry={retry}
            homeHref='/'
            homeLabel='Voltar para o início'
          />
        </main>
      </body>
    </html>
  );
}
