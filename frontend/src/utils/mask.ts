export const mask = (value: string | undefined) => {
  if(!value) return '';

  value = value.replace(/\D/g, "")

  return value.replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2") 

}