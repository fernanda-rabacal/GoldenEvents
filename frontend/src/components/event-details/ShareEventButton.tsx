'use client';

import { Share2 } from 'lucide-react';
import { toastNotify } from '@/lib/toastify';
import { Button } from '@/ui/button';

export function ShareEventButton({ title }: { title: string }) {
  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      // Rejeita quando a pessoa fecha a janela de compartilhamento
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }

    await navigator.clipboard.writeText(url);
    toastNotify('success', 'Link do evento copiado!');
  }

  return (
    <Button
      variant='outline'
      size='icon'
      aria-label='Compartilhar evento'
      onClick={handleShare}
    >
      <Share2 />
    </Button>
  );
}
