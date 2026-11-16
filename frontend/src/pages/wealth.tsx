import { useState } from "react"
import { Landmark, ArrowUpRight, ArrowDownRight, PiggyBank, Target, CalendarDays } from "lucide-react"

import { useWealthSummary } from "@/hooks/use-dashboard"
import { formatCurrency } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export function WealthPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  // Gera uma lista de anos (ex: do ano passado até 2 anos no futuro)
  const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

  const { data, isLoading, isError } = useWealthSummary(year)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return <div className="p-8 text-center text-destructive">Erro ao carregar os dados do patrimônio.</div>
  }

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho com Seletor de Ano */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Visão Anual e Patrimônio</h2>
          <p className="text-sm text-muted-foreground">Acompanhe sua evolução e projeções.</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CARD PRINCIPAL: PATRIMÔNIO LÍQUIDO */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Patrimônio Líquido ({data.year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight text-primary">
            {formatCurrency(data.net_worth)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Dinheiro em conta + Investimentos
          </p>
        </CardContent>
      </Card>

      {/* GRID DE TOTAIS REAIS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Caixa (Saldo em Conta)</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${Number(data.liquid_cash) < 0 ? 'text-expense' : 'text-foreground'}`}>
              {formatCurrency(data.liquid_cash)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Investido</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(data.total_invested)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Aportes no ano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Receitas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-income" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-income">{formatCurrency(data.total_income)}</p>
            <p className="text-xs text-muted-foreground mt-1">Entradas no ano</p>
          </CardContent>
        </Card>
      </div>

      {/* PROJEÇÕES ANUAIS */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Projeções para o Final do Ano</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Projeção de Receitas</p>
              <p className="text-xl font-semibold text-income flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" /> {formatCurrency(data.projected_annual_income)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Projeção de Despesas</p>
              <p className="text-xl font-semibold text-expense flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4" /> {formatCurrency(data.projected_annual_expense)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-foreground mb-1">Economia Projetada</p>
              <p className={`text-xl font-bold ${Number(data.projected_annual_savings) < 0 ? 'text-destructive' : 'text-primary'}`}>
                {formatCurrency(data.projected_annual_savings)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}