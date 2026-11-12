import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis } from "recharts"
import { PieChart as PieIcon } from "lucide-react"

import { useDashboardSummary } from "@/hooks/use-dashboard"
import { formatCurrency } from "@/lib/format"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

// Formata "2026-11" para "Nov/26"
function formatMonthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" })
    .format(date)
    .replace(".", "")
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardSummary()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !data) {
    return <div className="p-8 text-center text-destructive">Erro ao carregar o dashboard.</div>
  }

  // 1. Dados do Gráfico de Pizza
  const pieData = data.expenses_by_category.map((item) => ({
    name: item.name,
    total: Number(item.total),
    fill: item.color,
  }))

  const pieConfig = pieData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill }
    return acc
  }, {} as ChartConfig)

  // 2. Dados do Gráfico de Barras
  const barData = data.monthly_summary.map((item) => ({
    month: formatMonthLabel(item.month),
    income: Number(item.income),
    expense: Number(item.expense),
  }))

  const barConfig = {
    income: { label: "Receitas", color: "var(--income)" },
    expense: { label: "Despesas", color: "var(--expense)" },
  } satisfies ChartConfig

  // 3. Totais Gerais
  const totalIncome = data.monthly_summary.reduce((acc, curr) => acc + Number(curr.income), 0)
  const totalExpense = data.monthly_summary.reduce((acc, curr) => acc + Number(curr.expense), 0)

  const hasExpenses = pieData.length > 0
  const hasMonths = barData.length > 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        
        {/* GRÁFICO DE PIZZA - DESPESAS POR CATEGORIA */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Para onde seu dinheiro está indo</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {!hasExpenses ? (
              <div className="flex h-[300px] flex-col items-center justify-center text-muted-foreground">
                <PieIcon className="h-10 w-10 mb-2 opacity-20" />
                <p>Nenhuma despesa registrada ainda.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full mt-4">
                <ChartContainer config={pieConfig} className="h-full w-full">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={pieData} dataKey="total" nameKey="name" innerRadius={60} strokeWidth={5}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RESUMO FINANCEIRO */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>Totais do período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm font-medium text-muted-foreground">Total em Receitas</span>
              <span className="text-lg font-bold text-income">
                + {formatCurrency(totalIncome.toString())}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total em Despesas</span>
              <span className="text-lg font-bold text-expense">
                - {formatCurrency(totalExpense.toString())}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICO DE BARRAS - EVOLUÇÃO MENSAL */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
          <CardDescription>Comparativo de receitas e despesas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasMonths ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Nenhum dado mensal disponível.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ChartContainer config={barConfig} className="h-full w-full">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}