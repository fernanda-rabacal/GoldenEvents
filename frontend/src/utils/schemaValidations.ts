import z from 'zod';
import dayjs from 'dayjs';

export const eventValidationSchema = z
  .object({
    photo: z.string().optional().nullable(),
    name: z.string().min(5, 'O nome é obrigatório'),
    subtitle: z.string().trim().optional(),
    location: z.string().min(5, 'O local do evento é obrigatório'),
    categoryId: z.coerce.number().min(1, 'A categoria do evento é obrigatória'),
    capacity: z.coerce
      .number()
      .min(1, 'A capacidade do evento é obrigatória')
      .int('Precisa ser um número inteiro')
      .positive('A capacidade não pode ser negativa'),
    // Valor com máscara ("R$ 45,00"); vira número com parseCurrency ao enviar
    price: z.string().min(1, 'O preço é obrigatório'),
    description: z
      .string()
      .min(100, 'A descrição é obrigatória')
      .refine(
        (value) => {
          const hasContent = value.replaceAll('<[^>]*>', '');

          return hasContent.length > 0;
        },
        {
          message: 'Você precisa fornecer uma descrição para o evento',
        },
      ),
    startDateTime: z
      .string({
        required_error: 'A data de início é obrigatória',
      })
      .refine(
        (value) => {
          const date = dayjs(value);

          return date.isAfter(dayjs());
        },
        {
          message: 'A data precisa ser posterior a data de hoje',
        },
      ),
    /* .transform(value => dayjs(value).toISOString()) */ endDateTime: z
      .string()
      .optional() /* .transform(value => value && dayjs(value).toISOString()) */,
  })
  .refine(
    (data) => {
      if (!data.endDateTime) return true;

      const endDateTime = dayjs(data.endDateTime);
      const startDatetime = dayjs(data.startDateTime);
      const isValid =
        endDateTime.isAfter(dayjs()) && endDateTime.isAfter(startDatetime);

      return isValid;
    },
    {
      message: 'A data final precisa ser posterior a data de início',
      path: ['endDateTime'],
    },
  );

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Este campo é obrigatório' })
    .email('Informe um email válido.'),
  password: z
    .string()
    .min(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' }),
  keep_connected: z.boolean(),
});

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { message: 'Digite pelo menos três letras.' }),
    email: z
      .string()
      .min(1, { message: 'Este campo é obrigatório' })
      .email('Informe um email válido.'),
    cpf: z.string().refine((value) => value.replace(/\D/g, '').length === 11, {
      message: 'Informe um CPF com 11 números.',
    }),
    password: z
      .string()
      .min(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' }),
    confirm_password: z
      .string()
      .min(1, { message: 'Este campo é obrigatório' }),
    isOrganizer: z.enum(['true', 'false']),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Senhas não conferem.',
    path: ['confirm_password'],
  });

export const updateUserValidationSchema = z.object({
  photo: z.string().optional().nullable(),
  name: z.string().min(5, 'O nome é obrigatório'),
  userTypeId: z.coerce.number().min(1, 'O tipo de usuário é obrigatório'),
});
