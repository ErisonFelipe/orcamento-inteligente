/**
 * Cards de resumo no topo da página de Transações.
 *
 * Três métricas agregadas — Saldo, Receitas e Despesas — calculadas a partir
 * da lista de transações recebida. Os valores são formatados como moeda
 * brasileira (via `formatCurrency`) e a cor comunica o significado:
 *
 * - Saldo: neutro (positivo) ou vermelho (negativo);
 * - Receitas: verde (`text-income`), com sinal `+`;
 * - Despesas: vermelho (`text-expense`), com sinal `-`.
 *
 * Nota: os totais refletem a lista RECEBIDA. Enquanto não houver filtros
 * (3.6), isso equivale a "tudo o que está na página atual" (até 50 itens).
 * Quando filtros chegarem, o resumo acompanhará automaticamente.
 */

import { TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateTotals, formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TransactionRead } from "@/types/transaction"

type TransactionsSummaryProps = {
  items: TransactionRead[]
}

export function TransactionsSummary({ items }: TransactionsSummaryProps) {
  const totals = calculateTotals(items)
  const balance = Number(totals.balance)
  const isNegative = balance < 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Saldo */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo
          </CardTitle>
          <Wallet
            className={cn(
              "h-4 w-4",
              isNegative ? "text-expense" : "text-muted-foreground",
            )}
          />
        </CardHeader>
        <CardContent>
          <p
            className={cn(
              "text-2xl font-bold tracking-tight",
              isNegative ? "text-expense" : "text-foreground",
            )}
          >
            {formatCurrency(totals.balance)}
          </p>
          <p className="text-xs text-muted-foreground">Receitas menos despesas</p>
        </CardContent>
      </Card>

      {/* Receitas */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receitas
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-income" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-income">
            + {formatCurrency(totals.income)}
          </p>
          <p className="text-xs text-muted-foreground">Total de entradas</p>
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-expense" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-expense">
            - {formatCurrency(totals.expense)}
          </p>
          <p className="text-xs text-muted-foreground">Total de saídas</p>
        </CardContent>
      </Card>
    </div>
  )
}