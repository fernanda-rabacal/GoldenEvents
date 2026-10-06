export function formatMoney(value: number) {
  const formattedValue = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return 'R$ ' + formattedValue;
}

export function formatTicketPrice(price: number) {
  return price > 0 ? formatMoney(price) : 'Entrada gratuita';
}
