export const maskDocument = (value: string | undefined) => {
  if(!value) return '';

  value = value.replace(/\D/g, "")

  if(value.length >= 14) {
    return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  return value.replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2") 
}

export const maskMoney = (value: string | undefined) => {
  if(!value) return '';

  const formattedValue = value.replace('.', '').replace(',', '').replace(/\D/g, '').replace("R$ ", '')
  const result = parseFloat(formattedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  console.log(result)

  return result
}