import { useState } from "react"
import { Plus, TrendingUp, Trash2, Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { formatCurrency, formatDate } from "@/lib/format"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  useInvestments,
  useCreateBulkInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
} from "@/hooks/use-investments"

// Motor de cálculo para os inputs
function evaluateMath(expression: string): string {
  try {
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '')
    if (!sanitized) return expression
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)()
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result.toFixed(2)
    }
  } catch (error) {}
  return expression
}

// Schema do formulário de investimento
const investmentSchema = z.object({
  date: z.string().min(1, "Data obrigatória"),
  totalAmount: z.string().min(1, "Valor total obrigatório"),
  allocations: z.array(
    z.object({
      name: z.string().min(1, "Nome do ativo obrigatório"),
      type: z.string().min(1, "Tipo obrigatório"),
      amount: z.string().min(1, "Valor obrigatório"),
    })
  ).min(1, "Adicione pelo menos um ativo"),
})

type InvestmentFormValues = z.infer<typeof investmentSchema>

export function InvestmentsPage() {
  const { data, isLoading } = useInvestments()
  const createBulkMutation = useCreateBulkInvestment()
  const updateMutation = useUpdateInvestment()
  const deleteMutation = useDeleteInvestment()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: { 
      date: new Date().toISOString().slice(0, 10), 
      totalAmount: "",
      allocations: [{ name: "", type: "Ações", amount: "" }]
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allocations",
  })

  const watchTotal = Number(evaluateMath(form.watch("totalAmount") || "0")) || 0
  const watchAllocations = form.watch("allocations") || []
  
  const totalAllocated = watchAllocations.reduce((acc, curr) => {
    return acc + (Number(evaluateMath(curr.amount || "0")) || 0)
  }, 0)

  const remainingCash = watchTotal - totalAllocated
  const isOverAllocated = remainingCash < -0.01

  function openCreate() {
    setEditingId(null)
    form.reset({ 
      date: new Date().toISOString().slice(0, 10), 
      totalAmount: "",
      allocations: [{ name: "", type: "Ações", amount: "" }]
    })
    setIsDialogOpen(true)
  }

  // A edição para investimentos é simplificada (só edita os dados básicos do ativo)
  function openEdit(inv: any) {
    setEditingId(inv.id)
    form.reset({ 
      date: inv.date, 
      totalAmount: inv.amount, 
      allocations: [{ name: inv.name, type: inv.type, amount: inv.amount }]
    })
    setIsDialogOpen(true)
  }

  async function onSubmit(values: InvestmentFormValues) {
    if (isOverAllocated) {
      toast.error("A soma das alocações é maior que o valor total.")
      return
    }

    try {
      if (editingId) {
        // Edição simples (apenas 1 item)
        await updateMutation.mutateAsync({ 
          id: editingId, 
          payload: {
            name: values.allocations[0].name,
            type: values.allocations[0].type,
            amount: evaluateMath(values.allocations[0].amount),
            date: values.date
          } 
        })
        toast.success("Investimento atualizado")
      } else {
        // Criação com Rateio
        const itemsToCreate = values.allocations.map(alloc => ({
          name: alloc.name,
          type: alloc.type,
          amount: evaluateMath(alloc.amount),
          date: values.date
        }))

        // Se sobrou dinheiro, adiciona no Caixa automaticamente
        if (remainingCash > 0.01) {
          itemsToCreate.push({
            name: "Caixa (Não alocado)",
            type: "Caixa",
            amount: remainingCash.toFixed(2),
            date: values.date
          })
        }

        await createBulkMutation.mutateAsync({ items: itemsToCreate })
        toast.success(`Aporte de ${formatCurrency(values.totalAmount)} registrado`)
      }
      setIsDialogOpen(false)
    } catch (err) {
      toast.error("Erro ao salvar investimento")
    }
  }

  function handleDelete(id: number) {
    if (confirm("Tem certeza que deseja excluir este investimento?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success("Investimento excluído"),
        onError: () => toast.error("Erro ao excluir"),
      })
    }
  }

  const items = data?.items ?? []
  const totalInvested = items.reduce((acc, item) => acc + Number(item.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Meus Investimentos</h2>
          <p className="text-sm text-muted-foreground">Acompanhe seus aportes e o caixa da corretora.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Aporte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Patrimônio em Investimentos</p>
            <p className="text-2xl font-bold text-income mt-2">
              {formatCurrency(totalInvested.toString())}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">Nenhum investimento registrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg bg-card group">
              <div>
                <p className="font-medium">{inv.name}</p>
                <p className="text-xs text-muted-foreground">{inv.type} · {formatDate(inv.date)}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-income">{formatCurrency(inv.amount)}</p>
                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inv)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inv.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Investimento" : "Novo Aporte"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Altere os dados do ativo." : "Quanto você transferiu da conta corrente? Distribua abaixo."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Aporte</Label>
                <Input type="date" {...form.register("date")} />
              </div>
              {!editingId && (
                <div className="space-y-2">
                  <Label>Valor Total Transferido (R$)</Label>
                  <Input 
                    placeholder="Ex: 1000" 
                    {...form.register("totalAmount", {
                      onBlur: (e) => {
                        const val = e.target.value
                        if (val) form.setValue("totalAmount", evaluateMath(val), { shouldValidate: true })
                      }
                    })} 
                  />
                </div>
              )}
            </div>

            {/* LISTA DINÂMICA DE ALOCAÇÕES */}
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Distribuição (Para onde foi o dinheiro?)</Label>
                {!editingId && (
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", type: "Ações", amount: "" })}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Ativo
                  </Button>
                )}
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end p-3 border rounded-md bg-muted/20">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Ativo</Label>
                    <Input placeholder="Ex: PETR4" {...form.register(`allocations.${index}.name`)} />
                  </div>
                  <div className="w-[120px] space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Input placeholder="Ex: Ações" {...form.register(`allocations.${index}.type`)} />
                  </div>
                  <div className="w-[100px] space-y-1">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input 
                      placeholder="0.00" 
                      {...form.register(`allocations.${index}.amount`, {
                        onBlur: (e) => {
                          const val = e.target.value
                          if (val) form.setValue(`allocations.${index}.amount`, evaluateMath(val), { shouldValidate: true })
                        }
                      })} 
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-9 w-9 shrink-0" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* RESUMO DO CAIXA */}
            {!editingId && (
              <div className={`p-3 rounded-md text-sm ${isOverAllocated ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                <div className="flex justify-between font-medium">
                  <span>Total alocado:</span>
                  <span>{formatCurrency(totalAllocated.toFixed(2))}</span>
                </div>
                {remainingCash > 0 ? (
                  <div className="flex justify-between mt-1 pt-1 border-t border-primary/20">
                    <span>Sobra para Caixa da Corretora:</span>
                    <span className="font-bold">{formatCurrency(remainingCash.toFixed(2))}</span>
                  </div>
                ) : remainingCash < 0 ? (
                  <div className="flex justify-between mt-1 pt-1 border-t border-destructive/20 font-bold">
                    <span>Atenção: Valores excedem o total!</span>
                    <span>{formatCurrency(Math.abs(remainingCash).toFixed(2))}</span>
                  </div>
                ) : null}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createBulkMutation.isPending || updateMutation.isPending || isOverAllocated}>
                {createBulkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}