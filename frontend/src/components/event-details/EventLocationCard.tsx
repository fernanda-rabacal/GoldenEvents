import { ArrowRight } from 'lucide-react';
import { getMapsUrl, splitLocation } from '@/utils/location';

export function EventLocationCard({ location }: { location: string }) {
  const { place, region } = splitLocation(location);

  return (
    <div className='rounded-2xl border border-border bg-card p-5'>
      <h3 className='font-black text-foreground'>{place}</h3>
      {region && (
        <p className='mt-2 text-body-sm text-muted-foreground'>{region}</p>
      )}
      <a
        href={getMapsUrl(location)}
        target='_blank'
        rel='noreferrer'
        className='mt-4 inline-flex items-center gap-1.5 text-body-sm font-bold text-accent-foreground transition hover:text-orange-500'
      >
        Ver localização no mapa <ArrowRight className='size-4' />
      </a>
    </div>
  );
}
