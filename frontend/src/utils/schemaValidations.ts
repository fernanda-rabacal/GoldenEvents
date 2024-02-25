import z from "zod";
import dayjs from "dayjs";

export const createEventSchema = z.object({
  photo: z.string().optional(),
  name: z.string().min(5, "O nome é obrigatório"),
  location: z.string().min(5, "O local do evento é obrigatório"),
  category: z.coerce
    .number()
    .min(1, "A categoria do evento é obrigatória"),
  capacity: z.coerce
    .number()
    .min(1, "A capacidade do evento é obrigatória")
    .int("Precisa ser um número inteiro")
    .positive("A capacidade não pode ser negativa"),
  price: z.coerce
    .number()
    .min(1, "O preço do evento é obrigatório")
    .positive("O preço não pode ser negativo"),
  description: z
    .string()
    .min(100, "A descrição é obrigatória")
    .refine(value => {
      const hasContent = value.replaceAll("<[^>]*>", "")

      return hasContent.length > 0
    }, {
      message: "Você precisa fornecer uma descrição para o evento"
    }),
  start_date: z
    .string({
      required_error: 'A data de início é obrigatória'
    })
    .refine(value => {
      const date = dayjs(value);

      return date.isAfter(dayjs());
    }, {
      message: 'A data precisa ser posterior a data de hoje'
    }),
  end_date: z.string().optional(),
})
.refine(data => {
  if (!data.end_date) return true;
  
  const end_date = dayjs(data.end_date);
  const start_date = dayjs(data.start_date);
  const isValid = end_date.isAfter(dayjs()) && end_date.isAfter(start_date)

  return isValid;
}, {
  message: 'A data final precisa ser posterior a data de início',
  path: ["end_date"]
})