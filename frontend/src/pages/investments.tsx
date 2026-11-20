import { useState, useMemo } from "react"
import { Plus, TrendingUp, Trash2, Pencil, Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { formatCurrency, formatDate } from "@/lib/format"
import { investmentsApi } from "@/services/api"

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

  // Modais de atualização de saldo
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [editingBalanceId, setEditingBalanceId] = useState<number | null>(null)
  const [newBalance, setNewBalance] = useState("")

  const items = data?.items ?? []

  // Calcula o valor total que já está em caixa (não alocado)
  const currentCash = useMemo(() => {
    return items
      .filter((inv) => inv.name === "Caixa (Não alocado)" || inv.type === "Caixa")
      .reduce((acc, inv) => acc + Number(inv.current_value || inv.amount), 0)
  }, [items])

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

  // O total disponível é o que está no caixa + o novo aporte
  const totalAvailable = currentCash + watchTotal
  const remainingCash = totalAvailable - totalAllocated
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

  function openEdit(inv: any) {
    setEditingId(inv.id)
    form.reset({ 
      date: inv.date, 
      totalAmount: inv.amount, 
      allocations: [{ name: inv.name, type: inv.type, amount: inv.amount }]
    })
    setIsDialogOpen(true)
  }

  function openBalanceEdit(inv: any) {
    setEditingBalanceId(inv.id)
    setNewBalance(inv.current_value || inv.amount)
    setIsBalanceDialogOpen(true)
  }

  async function handleSaveBalance() {
    if (!editingBalanceId) return
    try {
      await updateMutation.mutateAsync({
        id: editingBalanceId,
        payload: { current_value: Number(newBalance).toFixed(2) }
      })
      toast.success("Saldo do ativo atualizado!")
      setIsBalanceDialogOpen(false)
    } catch (err) {
      toast.error("Erro ao atualizar saldo")
    }
  }

  async function onSubmit(values: InvestmentFormValues) {
    if (isOverAllocated) {
      toast.error("A soma das alocações é maior que o valor disponível (Aporte + Caixa).")
      return
    }

    try {
      if (editingId) {
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
        // 1. Encontra os registros antigos de caixa para deletar
        const oldCashItems = items.filter(
          (inv) => inv.name === "Caixa (Não alocado)" || inv.type === "Caixa"
        )

        // 2. Prepara os novos ativos
        const itemsToCreate = values.allocations.map(alloc => ({
          name: alloc.name,
          type: alloc.type,
          amount: evaluateMath(alloc.amount),
          date: values.date
        }))

        // 3. Se sobrou dinheiro no caixa, adiciona o novo registro de caixa
        if (remainingCash > 0.01) {
          itemsToCreate.push({
            name: "Caixa (Não alocado)",
            type: "Caixa",
            amount: remainingCash.toFixed(2),
            date: values.date
          })
        }

        // 4. Deleta os caixas antigos para não duplicar o dinheiro
        if (oldCashItems.length > 0) {
          await Promise.all(oldCashItems.map(inv => investmentsApi.delete(inv.id)))
        }

        // 5. Cria os novos registros
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

  const totalInvested = items.reduce((acc, item) => acc + Number(item.current_value || item.amount), 0)

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Patrimônio em Investimentos</p>
            <p className="text-2xl font-bold text-primary mt-2">
              {formatCurrency(totalInvested.toString())}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Caixa Disponível (Não Alocado)
            </p>
            <p className="text-2xl font-bold text-primary mt-2">
              {formatCurrency(currentCash.toString())}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Este saldo pode ser usado no seu próximo aporte.
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
          {items.map((inv) => {
            const value = Number(inv.current_value || inv.amount)
            const aporte = Number(inv.amount)
            const profit = value - aporte
            const profitPercentage = aporte > 0 ? (profit / aporte) * 100 : 0

            return (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card group gap-4">
                <div>
                  <p className="font-medium">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">{inv.type} · {formatDate(inv.date)}</p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Valor Atual</p>
                    <p className="font-semibold text-primary">{formatCurrency(value.toString())}</p>
                    {profit !== 0 && (
                      <p className={`text-xs ${profit > 0 ? 'text-income' : 'text-expense'}`}>
                        {profit > 0 ? '+' : ''}{formatCurrency(profit.toString())} ({profitPercentage.toFixed(1)}%)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openBalanceEdit(inv)}>
                      Atualizar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inv)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inv.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE NOVO APORTE */}
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
                  <Label>Novo Valor Transferido (R$)</Label>
                  <Input 
                    placeholder="Ex: 100" 
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

            {!editingId && (
              <div className="p-2 bg-muted rounded text-sm flex justify-between">
                <span>Caixa já existente:</span>
                <span className="font-medium">{formatCurrency(currentCash.toFixed(2))}</span>
              </div>
            )}

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

            {!editingId && (
              <div className={`p-3 rounded-md text-sm ${isOverAllocated ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                <div className="flex justify-between font-medium">
                  <span>Total Disponível (Aporte + Caixa):</span>
                  <span>{formatCurrency(totalAvailable.toFixed(2))}</span>
                </div>
                <div className="flex justify-between font-medium mt-1">
                  <span>Total alocado agora:</span>
                  <span>{formatCurrency(totalAllocated.toFixed(2))}</span>
                </div>
                
                {remainingCash > 0 ? (
                  <div className="flex justify-between mt-1 pt-1 border-t border-primary/20">
                    <span>Nova sobra para Caixa:</span>
                    <span className="font-bold">{formatCurrency(remainingCash.toFixed(2))}</span>
                  </div>
                ) : remainingCash < 0 ? (
                  <div className="flex justify-between mt-1 pt-1 border-t border-destructive/20 font-bold">
                    <span>Atenção: Valores excedem o disponível!</span>
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

      {/* MODAL DE ATUALIZAR SALDO */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Atualizar Valor do Ativo</DialogTitle>
            <DialogDescription>
              Insira o valor de mercado atual. O aporte original não muda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo Valor (R$)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={newBalance} 
                onChange={(e) => setNewBalance(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveBalance} disabled={updateMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}