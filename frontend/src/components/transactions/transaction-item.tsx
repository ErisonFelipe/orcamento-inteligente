import {
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useTransactionDialog } from "@/contexts/transaction-dialog-context"
import { useDeleteTransaction } from "@/hooks/use-transactions"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TransactionRead } from "@/types/transaction"

type TransactionItemProps = {
  transaction: TransactionRead
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const deleteMutation = useDeleteTransaction()
  const { openEdit } = useTransactionDialog()
  const isIncome = transaction.type === "income"
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight

  function handleDelete() {
    deleteMutation.mutate(transaction.id, {
      onSuccess: () => {
        toast.success("Transação excluída", {
          description: transaction.description,
        })
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Erro ao excluir transação",
        )
      },
    })
  }

  return (
    <div className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
      {/* Ícone de tipo */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          isIncome ? "bg-income/10 text-income" : "bg-expense/10 text-expense",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Descrição + categoria/data */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{transaction.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {transaction.category?.name || "Sem categoria"} · {" "} 
          {formatDate(transaction.date)}
        </p>
      </div>

      {/* Valor + botões de ação */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        <p
          className={cn(
            "shrink-0 text-right font-semibold tabular-nums mr-1 md:mr-2",
            isIncome ? "text-income" : "text-expense",
          )}
        >
          {isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
        </p>

        {/* Botão Editar (Sempre visível no mobile, hover no desktop) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => openEdit(transaction)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar transação</span>
        </Button>

        {/* Botão Excluir (Sempre visível no mobile, hover no desktop) */}
                <AlertDialog>
          {/* REMOVIDO O asChild E O <Button> INTERNO */}
          <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Excluir transação</span>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
              <AlertDialogDescription>
                "{transaction.description}" será removida permanentemente.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}