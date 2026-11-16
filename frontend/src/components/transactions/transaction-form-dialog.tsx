import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateBulkTransaction, useCreateTransaction, useUpdateTransaction } from "@/hooks/use-transactions"
import { useCategories } from "@/hooks/use-categories"
import { useDebounce } from "@/hooks/use-debounce"
import { transactionsApi } from "@/services/api"
import { addMonths, formatCurrency } from "@/lib/format"
import { toCreatePayload, toUpdatePayload, transactionFormSchema, type TransactionFormValues } from "@/lib/transaction-form-schema"
import type { TransactionRead } from "@/types/transaction"

type TransactionFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: TransactionRead | null
}

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY_VALUES: TransactionFormValues = {
  description: "",
  amount: "",
  type: "expense",
  category_id: null,
  date: today(),
}

function valuesFromTransaction(t: TransactionRead): TransactionFormValues {
  return {
    description: t.description,
    amount: t.amount,
    type: t.type,
    category_id: t.category_id ?? null,
    date: t.date,
  }
}

// NOVO: Função que calcula a expressão matemática com segurança
function evaluateMath(expression: string): string {
  try {
    // Remove tudo que não for número ou operadores matemáticos básicos por segurança
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '')
    if (!sanitized) return expression
    
    // Usa Function para calcular a expressão (seguro pois já limpamos a string)
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)()
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result.toFixed(2)
    }
  } catch (error) {
    // Se der erro (ex: 100 * * 2), ignora e mantém o texto original
  }
  return expression
}

export function TransactionFormDialog({ open, onOpenChange, transaction }: TransactionFormDialogProps) {
  const isEdit = Boolean(transaction)
  const createMutation = useCreateTransaction()
  const createBulkMutation = useCreateBulkTransaction()
  const updateMutation = useUpdateTransaction()
  const { data: categories } = useCategories()
  
  const isSubmitting = createMutation.isPending || updateMutation.isPending || createBulkMutation.isPending

  const [installments, setInstallments] = useState(1)
  const [isPredicting, setIsPredicting] = useState(false)
  const [aiSuggested, setAiSuggested] = useState<number | null>(null)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    mode: "onBlur",
    defaultValues: transaction ? valuesFromTransaction(transaction) : EMPTY_VALUES,
  })

  const description = form.watch("description")
  const type = form.watch("type")
  const amount = form.watch("amount")
  const debouncedDescription = useDebounce(description, 800)

  useEffect(() => {
    if (open) {
      form.reset(transaction ? valuesFromTransaction(transaction) : EMPTY_VALUES)
      setAiSuggested(null)
      setInstallments(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction])

  useEffect(() => {
    if (!open || isEdit || debouncedDescription.length < 3 || form.formState.dirtyFields.category_id) return
    async function getPrediction() {
      setIsPredicting(true)
      try {
        const res = await transactionsApi.predictCategory(debouncedDescription)
        if (res.category_id) {
          form.setValue("category_id", res.category_id, { shouldValidate: true })
          setAiSuggested(res.category_id)
        }
      } catch (err) {} finally { setIsPredicting(false) }
    }
    getPrediction()
  }, [debouncedDescription, open, isEdit, form])

  // NOVO: Se o usuário submeter o form sem sair do campo de valor, calcula a conta antes de validar
  async function onSubmit(values: TransactionFormValues) {
    const calculatedAmount = evaluateMath(values.amount)
    const finalValues = { ...values, amount: calculatedAmount }

    try {
      if (transaction) {
        await updateMutation.mutateAsync({ id: transaction.id, payload: toUpdatePayload(finalValues) })
        toast.success("Transação atualizada", { description: finalValues.description })
      } else if (installments > 1) {
        const basePayload = toCreatePayload(finalValues)
        
        const amountPerItem = type === "expense" 
          ? Number((Number(basePayload.amount) / installments).toFixed(2))
          : Number(basePayload.amount)
          
        const items = Array.from({ length: installments }).map((_, index) => {
          let finalAmount = amountPerItem
          if (index === installments - 1 && type === "expense") {
            finalAmount = Number(basePayload.amount) - (amountPerItem * (installments - 1))
          }

          return {
            ...basePayload,
            amount: finalAmount.toFixed(2),
            date: addMonths(basePayload.date, index),
            description: type === "expense" 
              ? `${finalValues.description} (${index + 1}/${installments})`
              : `${finalValues.description} (${index + 1}/${installments})`
          }
        })

        await createBulkMutation.mutateAsync({ items })
        toast.success(`${installments} transações criadas`, { description: finalValues.description })
      } else {
        await createMutation.mutateAsync(toCreatePayload(finalValues))
        toast.success("Transação criada", { description: finalValues.description })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar transação")
    }
  }

  // Para a mensagem visual na tela
  const calculatedPreviewAmount = Number(evaluateMath(amount)) || 0
  const displayAmount = type === "expense" 
    ? calculatedPreviewAmount / installments 
    : calculatedPreviewAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar transação" : "Nova transação"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Altere os campos que precisar." : "Preencha os dados para registrar."}
          </DialogDescription>
        </DialogHeader>

        <form id="transaction-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" placeholder="Ex.: Salário / Empréstimo" autoComplete="off" {...form.register("description")} />
            {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {type === "expense" && installments > 1 ? "Valor Total (R$)" : "Valor (R$)"}
              </Label>
              
              {/* NOVO: Input com cálculo matemático */}
              <Input 
                id="amount" 
                type="text" 
                placeholder="Ex: 1600 * 2" 
                autoComplete="off"
                {...form.register("amount", {
                  onBlur: (e) => {
                    const val = e.target.value
                    if (val) {
                      const calculated = evaluateMath(val)
                      if (calculated !== val) {
                        form.setValue("amount", calculated, { shouldValidate: true })
                      }
                    }
                  }
                })} 
              />
              {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data (1ª)</Label>
              <Input id="date" type="date" {...form.register("date")} />
              {form.formState.errors.date && <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>}
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
              <Label htmlFor="installments" className="text-sm font-semibold">
                {type === "expense" ? "Parcelar em quantas vezes?" : "Repetir por quantos meses?"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="installments"
                  type="number"
                  min={1}
                  max={48}
                  className="w-24"
                  value={installments}
                  onChange={(e) => setInstallments(Math.max(1, Number(e.target.value)))}
                />
                <span className="text-sm text-muted-foreground">
                  {type === "expense" ? "parcelas" : "meses"}
                </span>
              </div>
              {installments > 1 && (
                <p className="text-xs text-primary mt-1">
                  Serão criadas {installments} transações de {formatCurrency(displayAmount.toFixed(2))}.
                  {type === "income" && ` (Total: ${formatCurrency((calculatedPreviewAmount * installments).toFixed(2))})`}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category_id">Categoria</Label>
              {isPredicting && <span className="text-xs text-primary flex items-center gap-1 animate-pulse"><Sparkles className="h-3 w-3" /> Pensando...</span>}
              {!isPredicting && aiSuggested && <span className="text-xs text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" /> Sugerido pela IA</span>}
            </div>
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : "none"} onValueChange={(val) => { field.onChange(val === "none" ? null : Number(val)); setAiSuggested(null) }}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="transaction-form" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}