// Os valores chegam da API em centavos
export function formatMoney(cents: number) {
  const formattedValue = (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return 'R$ ' + formattedValue;
}

export function formatTicketPrice(cents: number) {
  return cents > 0 ? formatMoney(cents) : 'Entrada gratuita';
}

// "R$ 48.920", sem centavos, para os indicadores do painel
export function formatWholeMoney(cents: number) {
  return 'R$ ' + Math.round(cents / 100).toLocaleString('pt-BR');
}
