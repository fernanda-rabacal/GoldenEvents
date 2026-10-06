function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function OrganizerCard({ name }: { name: string }) {
  return (
    <div className='flex items-center gap-4 rounded-2xl border border-border bg-card p-5'>
      <div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-accent font-black text-accent-foreground'>
        {getInitials(name)}
      </div>
      <div>
        <h3 className='font-black text-foreground'>{name}</h3>
        <p className='mt-1 text-body-sm text-muted-foreground'>
          Organizador do evento
        </p>
      </div>
    </div>
  );
}
