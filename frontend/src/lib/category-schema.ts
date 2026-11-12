import { z } from "zod"

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "A categoria precisa ter pelo menos 2 letras")
    .max(100, "Máximo de 100 caracteres"),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor inválida"),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>