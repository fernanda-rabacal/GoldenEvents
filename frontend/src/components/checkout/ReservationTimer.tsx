'use client';

import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';
import { Clock } from 'lucide-react';

function subscribeToClock(callback: () => void) {
  const interval = setInterval(callback, 1000);

  return () => clearInterval(interval);
}

const getNowInSeconds = () => Math.floor(Date.now() / 1000);

type ReservationTimerProps = {
  expiresAt: string;
  onExpire: () => void;
};

export function ReservationTimer({
  expiresAt,
  onExpire,
}: ReservationTimerProps) {
  // null no servidor: o horário de lá não bate com o do navegador na hidratação
  const now = useSyncExternalStore(
    subscribeToClock,
    getNowInSeconds,
    () => null,
  );
  const remaining =
    now === null
      ? null
      : Math.max(0, Math.floor(new Date(expiresAt).getTime() / 1000) - now);
  const handleExpire = useEffectEvent(onExpire);

  useEffect(() => {
    if (remaining === 0) {
      handleExpire();
    }
  }, [remaining]);

  if (remaining === null) {
    return null;
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');

  return (
    <p className='mt-4 flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-body-sm font-bold text-accent-foreground'>
      <Clock className='size-4 shrink-0' />
      Ingressos reservados por {minutes}:{seconds}
    </p>
  );
}
