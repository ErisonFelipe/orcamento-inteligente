import { z } from "zod"
import type { TransactionCreate, TransactionUpdate } from "@/types/transaction"

export const transactionFormSchema = z.object({
  description: z.string().trim().min(1, "Descrição obrigatória").max(255, "Máximo de 255 caracteres"),
  amount: z
    .string()
    .min(1, "Informe um valor")
    .regex(/^\d+(\.\d{1,2})?$/, "Formato inválido (ex.: 42.75)")
    .refine((v) => Number(v) > 0, "Deve ser maior que zero")
    .refine((v) => Number(v) <= 9_999_999_999.99, "Valor máximo: 9.999.999.999,99"),
  type: z.enum(["income", "expense"], { message: "Selecione o tipo" }),
  
  // Mudou de string para number | null
  category_id: z.number().nullable().optional(), 
  
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (AAAA-MM-DD)")
    .refine((v) => !isNaN(Date.parse(v)), "Data inválida"),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>

export function toCreatePayload(values: TransactionFormValues): TransactionCreate {
  return {
    description: values.description.trim(),
    amount: Number(values.amount).toFixed(2),
    type: values.type,
    category_id: values.category_id || null, // Passa o ID ou null
    date: values.date,
  }
}

export function toUpdatePayload(values: TransactionFormValues): TransactionUpdate {
  return toCreatePayload(values)
}