'use client';

import {
  ErrorContent,
  type ErrorPageProps,
} from '@/components/layout/ErrorContent';
import { ORGANIZER_PATH } from '@/components/layout/nav-links';

export default function AdminError({ error, retry }: ErrorPageProps) {
  return (
    <ErrorContent
      digest={error.digest}
      retry={retry}
      homeHref={ORGANIZER_PATH}
      homeLabel='Voltar para o painel'
    />
  );
}
