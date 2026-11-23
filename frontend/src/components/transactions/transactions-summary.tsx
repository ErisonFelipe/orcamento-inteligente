import { TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

type TransactionsSummaryProps = {
  income: string;
  expense: string;
  balance: string;
}

export function TransactionsSummary({ income, expense, balance }: TransactionsSummaryProps) {
  const isNegative = Number(balance) < 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          <Wallet className={cn("h-4 w-4", isNegative ? "text-expense" : "text-muted-foreground")} />
        </CardHeader>
        <CardContent>
          <p className={cn("text-2xl font-bold tracking-tight", isNegative ? "text-expense" : "text-foreground")}>
            {formatCurrency(balance)}
          </p>
          <p className="text-xs text-muted-foreground">Receitas menos despesas</p>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
          <TrendingUp className="h-4 w-4 text-income" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-income">
            + {formatCurrency(income)}
          </p>
          <p className="text-xs text-muted-foreground">Total de entradas</p>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
          <TrendingDown className="h-4 w-4 text-expense" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-expense">
            - {formatCurrency(expense)}
          </p>
          <p className="text-xs text-muted-foreground">Total de saídas</p>
        </CardContent>
      </Card>
    </div>
  )
}