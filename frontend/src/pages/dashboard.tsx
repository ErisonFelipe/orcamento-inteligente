import { useState } from "react"
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine } from "recharts"
import { PieChart as PieIcon, AlertTriangle, Activity, ShieldAlert, Sparkles, RefreshCcw, CalendarClock } from "lucide-react"
import { format, parseISO } from "date-fns"

import { useDashboardSummary, useCashflowForecast, useFinancialProjection, useRecurringExpenses } from "@/hooks/use-dashboard"
import { formatCurrency } from "@/lib/format"
import { MonthSelector } from "@/components/layout/month-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

function formatMonthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date).replace(".", "").replace(/^\w/, (c) => c.toUpperCase())
}

export function DashboardPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const { data, isLoading, isError } = useDashboardSummary(month, year)
  const { data: cashflow, isLoading: isLoadingCashflow } = useCashflowForecast(6)
  const { data: projection, isLoading: isLoadingProjection } = useFinancialProjection()
  const { data: recurring, isLoading: isLoadingRecurring } = useRecurringExpenses()

  if (isLoading || isLoadingCashflow || isLoadingProjection || isLoadingRecurring) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end"><Skeleton className="h-10 w-[180px]" /></div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !data) {
    return <div className="p-8 text-center text-destructive">Erro ao carregar o dashboard. Verifique se o backend está rodando.</div>
  }

  // Dados do Gráfico de Pizza
  const pieData = Array.isArray(data.expenses_by_category) ? data.expenses_by_category.map((item) => ({
    name: item.name, total: Number(item.total), fill: item.color,
  })) : []
  const pieConfig = pieData.reduce((acc, item) => { acc[item.name] = { label: item.name, color: item.fill }; return acc }, {} as ChartConfig)
  const hasExpenses = pieData.length > 0

  // Dados do Gráfico de Barras
  const barData = Array.isArray(data.monthly_summary) ? data.monthly_summary.map((item) => ({
    month: formatMonthLabel(item.month), income: Number(item.income), expense: Number(item.expense),
  })) : []
  const barConfig = {
    income: { label: "Receitas", color: "var(--income)" },
    expense: { label: "Despesas", color: "var(--expense)" },
  } satisfies ChartConfig
  const hasMonths = barData.length > 0

  // Dados do Fluxo de Caixa (6 meses)
  const cashflowData = Array.isArray(cashflow?.forecast) ? cashflow.forecast.map(item => ({
    month: formatMonthLabel(item.month), balance: Number(item.balance)
  })) : []
  const cashflowConfig = { balance: { label: "Saldo Projetado", color: "var(--primary)" } } satisfies ChartConfig

  // Dados da Previsibilidade (12 meses)
  const projectionList = Array.isArray(projection?.projection) ? projection.projection : []
  const projectionData = projectionList.map(item => ({
    month: formatMonthLabel(item.month),
    balance: Number(item.projected_balance),
  }))
  const projectionConfig = { balance: { label: "Saldo Projetado", color: "var(--primary)" } } satisfies ChartConfig
  const lastMonthProjection = projectionList.length > 0 ? projectionList[projectionList.length - 1].projected_balance : "0"
  const alerts = projectionList.filter(item => item.alert_message !== null)

  const totalIncome = Array.isArray(data.monthly_summary) ? data.monthly_summary.reduce((acc, curr) => acc + Number(curr.income), 0) : 0
  const totalExpense = Array.isArray(data.monthly_summary) ? data.monthly_summary.reduce((acc, curr) => acc + Number(curr.expense), 0) : 0
  const forecast = data.forecast
  
  // Cálculo do progresso do mês para a barra visual
  const monthProgress = forecast ? Math.round((forecast.current_day / forecast.days_in_month) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {/* PREVISÃO DE FECHAMENTO DO MÊS (NOVO CARD) */}
      {forecast && (
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-primary">
              <CalendarClock className="h-5 w-5" />
              Previsão de Fechamento do Mês
            </CardTitle>
            <CardDescription>
              Estamos no dia {forecast.current_day} de {forecast.days_in_month}. Veja como seu mês deve terminar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Barra de Progresso do Mês */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso do mês</span>
                <span>{monthProgress}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${monthProgress}%` }} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-background/60 p-4 rounded-lg border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Despesa Atual</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalExpense.toString())}</p>
              </div>
              
              <div className="bg-background/60 p-4 rounded-lg border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Projeção de Despesa</p>
                <p className="text-xl font-bold text-expense">{formatCurrency(forecast.projected_expense.toString())}</p>
                <p className="text-xs text-muted-foreground mt-1">Média de {formatCurrency(forecast.daily_average)}/dia</p>
              </div>

              <div className={`p-4 rounded-lg border ${Number(forecast.projected_balance) >= 0 ? 'bg-income/10 border-income/20' : 'bg-destructive/10 border-destructive/20'}`}>
                <p className="text-xs font-medium uppercase tracking-wider mb-1 text-muted-foreground">Saldo no Fim do Mês</p>
                <p className={`text-xl font-bold ${Number(forecast.projected_balance) >= 0 ? 'text-income' : 'text-destructive'}`}>
                  {formatCurrency(forecast.projected_balance.toString())}
                </p>
              </div>
            </div>

            {forecast.alert_message && (
              <div className="flex items-start gap-2 mt-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{forecast.alert_message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ASSISTENTE DE PREVISIBILIDADE (12 MESES) */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            Assistente de Previsibilidade
          </CardTitle>
          <CardDescription>
            Projeção do seu saldo para os próximos 12 meses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Saldo Hoje</p>
              <p className="text-xl font-bold">{formatCurrency(projection?.current_balance || "0")}</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Sobra Média Mensal</p>
              <p className={`text-xl font-bold ${Number(projection?.average_monthly_net) >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(projection?.average_monthly_net || "0")}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${Number(lastMonthProjection) >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
              <p className="text-sm text-muted-foreground">Saldo em 12 meses</p>
              <p className={`text-xl font-bold ${Number(lastMonthProjection) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(lastMonthProjection)}
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ChartContainer config={projectionConfig} className="h-full w-full">
              <LineChart data={projectionData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(val) => `R$ ${val}`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <ReferenceLine y={0} stroke="var(--destructive)" strokeDasharray="3 3" opacity={0.5} />
                <Line type="monotone" dataKey="balance" stroke="var(--color-balance)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-balance)" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
          </div>

          {alerts.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Avisos do Assistente
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {alerts.slice(0, 3).map((alert, idx) => (
                  <li key={idx} className="text-sm text-destructive/90">
                    {alert.alert_message} (Saldo previsto: {formatCurrency(alert.projected_balance)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DESPESAS RECORRENTES */}
      {recurring && recurring.expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-primary" />
              Gastos Recorrentes
            </CardTitle>
            <CardDescription>
              Contas fixas identificadas. Total mensal: <strong className="text-foreground">{formatCurrency(recurring.total_monthly)}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recurring.expenses.map((expense, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: expense.category_color || "#94a3b8" }}>
                      {expense.description.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">Próxima: {format(parseISO(expense.next_estimated_date), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-expense">- {formatCurrency(expense.average_amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRÁFICOS ANTIGOS */}
      {cashflowData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Fluxo de Caixa Realista
            </CardTitle>
            <CardDescription>Contas agendadas para os próximos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full mt-4">
              <ChartContainer config={cashflowConfig} className="h-full w-full">
                <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(val) => `R$ ${val}`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area type="monotone" dataKey="balance" stroke="var(--color-balance)" fill="url(#fillBalance)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>Totais do período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm font-medium text-muted-foreground">Total em Receitas</span>
              <span className="text-lg font-bold text-income">+ {formatCurrency(totalIncome.toString())}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm font-medium text-muted-foreground">Total em Despesas</span>
              <span className="text-lg font-bold text-expense">- {formatCurrency(totalExpense.toString())}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Investido</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(data.total_invested)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
          <CardDescription>Comparativo de receitas e despesas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasMonths ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">Nenhum dado mensal disponível.</div>
          ) : (
            <div className="h-[300px] w-full">
              <ChartContainer config={barConfig} className="h-full w-full">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `R$ ${value}`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
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