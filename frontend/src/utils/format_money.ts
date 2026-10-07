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

// "R$ 48.920", sem centavos, para os indicadores do painel
export function formatWholeMoney(value: number) {
  return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
}
