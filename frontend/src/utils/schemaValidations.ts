import z, { ZodSchema } from "zod";
import dayjs from "dayjs";

export const eventValidationSchema = z.object({
  photo: z.string().optional().nullable(),
  name: z.string().min(5, "O nome é obrigatório"),
  location: z.string().min(5, "O local do evento é obrigatório"),
  categoryId: z.coerce
    .number()
    .min(1, "A categoria do evento é obrigatória"),
  capacity: z.coerce
    .number()
    .min(1, "A capacidade do evento é obrigatória")
    .int("Precisa ser um número inteiro")
    .positive("A capacidade não pode ser negativa"),
  price: z.coerce.number()
    .positive("O preço não pode ser negativo"),
   /*  .transform(value => {
      const formattedValue = value.replace("R$ ", '').replace(',', '.')

      return formattedValue
    }) */
  description: z
    .string()
    .min(100, "A descrição é obrigatória")
    .refine(value => {
      const hasContent = value.replaceAll("<[^>]*>", "")

      return hasContent.length > 0
    }, {
      message: "Você precisa fornecer uma descrição para o evento"
    }),
  startDateTime: z
    .string({
      required_error: 'A data de início é obrigatória'
    })
    .refine(value => {
      const date = dayjs(value);
      
      return date.isAfter(dayjs());
    }, {
      message: 'A data precisa ser posterior a data de hoje'
    })
    /* .transform(value => dayjs(value).toISOString()) */,
  endDateTime: z.string().optional()/* .transform(value => value && dayjs(value).toISOString()) */,
})
.refine(data => {
  if (!data.endDateTime) return true;
  
  const endDateTime = dayjs(data.endDateTime);
  const startDatetime = dayjs(data.startDateTime);
  const isValid = endDateTime.isAfter(dayjs()) && endDateTime.isAfter(startDatetime)

  return isValid;
}, {
  message: 'A data final precisa ser posterior a data de início',
  path: ["endDateTime"]
}) 
