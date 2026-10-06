// Texto fixo até a API ter política por evento
const POLICIES = [
  {
    title: 'Cancelamento',
    text: 'solicite o cancelamento em até 7 dias após a compra, desde que o pedido seja feito até 48 horas antes do evento.',
  },
  {
    title: 'Classificação',
    text: 'livre. Menores de idade devem estar acompanhados por um responsável.',
  },
];

export function EventPolicy() {
  return (
    <div className='flex flex-col gap-3 text-body-sm leading-6 text-muted-foreground'>
      {POLICIES.map((policy) => (
        <p key={policy.title}>
          <strong className='text-foreground'>{policy.title}:</strong>{' '}
          {policy.text}
        </p>
      ))}
    </div>
  );
}
