export const generateSlug = (value: string) =>
  value.toLowerCase().split(' ').join('-');
