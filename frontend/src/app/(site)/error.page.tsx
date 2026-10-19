'use client';

import {
  ErrorContent,
  type ErrorPageProps,
} from '@/components/layout/ErrorContent';

export default function SiteError({ error, retry }: ErrorPageProps) {
  return (
    <main>
      <ErrorContent
        digest={error.digest}
        retry={retry}
        homeHref='/'
        homeLabel='Voltar para o início'
      />
    </main>
  );
}
