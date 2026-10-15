// Faz o papel do SDK do provedor de pagamento: o cartão vira um token no navegador e
// o número nunca chega ao servidor. O provedor fake aprova qualquer token, menos tok_declined
const DECLINED_TEST_CARD = '4000000000000002';

export type CardData = {
  number: string;
  month: string;
  year: string;
  cvv: string;
};

export type CardTokenResult = { token: string } | { error: string };

function passesLuhn(digits: string) {
  const sum = [...digits].reverse().reduce((total, char, index) => {
    const digit = Number(char) * (index % 2 ? 2 : 1);

    return total + (digit > 9 ? digit - 9 : digit);
  }, 0);

  return sum % 10 === 0;
}

function randomId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export function createCardToken(card: CardData): CardTokenResult {
  const number = card.number.replace(/\D/g, '');

  if (number.length < 13 || number.length > 19 || !passesLuhn(number)) {
    return { error: 'Número do cartão inválido.' };
  }

  // Dia 1 do mês seguinte ao vencimento: o cartão vale até o fim do mês impresso
  if (new Date(Number(card.year), Number(card.month)) <= new Date()) {
    return { error: 'Este cartão está vencido.' };
  }

  if (!/^\d{3,4}$/.test(card.cvv)) {
    return { error: 'CVV inválido.' };
  }

  return {
    token: number === DECLINED_TEST_CARD ? 'tok_declined' : `tok_${randomId()}`,
  };
}
