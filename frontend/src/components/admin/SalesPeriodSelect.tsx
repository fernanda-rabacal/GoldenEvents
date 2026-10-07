'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  METRICS_PERIOD_OPTIONS,
  type MetricsPeriod,
} from '@golden-events/shared';

type SalesPeriodSelectProps = {
  value: MetricsPeriod;
};

export function SalesPeriodSelect({ value }: SalesPeriodSelectProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(period: string) {
    router.push(`${pathname}?periodo=${period}`, { scroll: false });
  }

  return (
    <label className='relative shrink-0'>
      <span className='sr-only'>Período do gráfico</span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className='h-9 appearance-none rounded-xl border border-border bg-background py-0 pr-9 pl-3 text-body-sm font-bold text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
      >
        {METRICS_PERIOD_OPTIONS.map((period) => (
          <option key={period} value={period}>
            Últimos {period} dias
          </option>
        ))}
      </select>
      <ChevronDown className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground' />
    </label>
  );
}
