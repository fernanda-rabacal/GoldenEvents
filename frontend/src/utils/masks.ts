import { formatMoney } from './format_money';

export const maskDocument = (value: string | undefined) => {
  if (!value) return '';

  value = value.replace(/\D/g, '');

  if (value.length >= 14) {
    return value.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  return value
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// Os dígitos digitados são centavos: "4500" -> "R$ 45,00"
export function maskCurrency(value: string) {
  return formatMoney(parseCurrency(value));
}

// Devolve centavos, o formato que a API recebe
export function parseCurrency(value: string) {
  return Number(value.replace(/\D/g, '') || 0);
}
