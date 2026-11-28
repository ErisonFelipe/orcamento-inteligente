import { useState } from "react"
import { useCalendarTransactions } from "@/hooks/use-transactions"
import { formatCurrency } from "@/lib/format"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthSelector } from "@/components/layout/month-selector"
import { parseISO } from "date-fns"
import { Loader2 } from "lucide-react"

export function CalendarPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today)

  const { data: transactions, isLoading } = useCalendarTransactions(month, year)

  // Agrupa as transações por dia (YYYY-MM-DD)
  const transactionsByDay = (transactions || []).reduce((acc, t) => {
    const dateStr = t.date
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(t)
    return acc
  }, {} as Record<string, typeof transactions>)

  // Descobre os dias que têm transações
  const daysWithTransactions = Object.keys(transactionsByDay).map(d => parseISO(d))

  const selectedDateStr = selectedDate ? selectedDate.toISOString().slice(0, 10) : ""
  const selectedTransactions = transactionsByDay[selectedDateStr] || []

  // Modificadores para o CSS do Calendário
  const modifiers = {
    hasIncome: daysWithTransactions.filter(d => 
      transactionsByDay[d.toISOString().slice(0, 10)]?.some(t => t.type === "income")
    ),
    hasExpense: daysWithTransactions.filter(d => 
      transactionsByDay[d.toISOString().slice(0, 10)]?.some(t => t.type === "expense")
    ),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        {/* Calendário */}
        <Card className="p-4 inline-block w-fit mx-auto md:mx-0">
          {isLoading ? (
            <div className="h-[300px] w-[280px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={new Date(year, month - 1)}
              onMonthChange={(newDate) => {
                setMonth(newDate.getMonth() + 1)
                setYear(newDate.getFullYear())
              }}
              modifiers={modifiers}
              modifiersClassNames={{
                hasIncome: "after:absolute after:bottom-1 after:left-[35%] after:h-1.5 after:w-1.5 after:rounded-full after:bg-income",
                hasExpense: "before:absolute before:bottom-1 before:right-[35%] before:h-1.5 before:w-1.5 before:rounded-full before:bg-expense",
              }}
            />
          )}
          <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-income" /> Receitas</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-expense" /> Despesas</div>
          </div>
        </Card>

        {/* Detalhes do Dia Selecionado */}
        <Card>
          <CardHeader>
            <CardTitle>
              Transações de {selectedDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTransactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma transação registrada neste dia.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTransactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/20">
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.category?.name || "Sem categoria"}</p>
                    </div>
                    <p className={`font-bold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                      {t.type === "income" ? "+" : "-"} {formatCurrency(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}