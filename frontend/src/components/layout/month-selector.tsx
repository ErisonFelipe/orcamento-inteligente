import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

type MonthSelectorProps = {
  month: number // 1 a 12
  year: number
  onChange: (month: number, year: number) => void
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  function handlePrev() {
    if (month === 1) onChange(12, year - 1)
    else onChange(month - 1, year)
  }

  function handleNext() {
    if (month === 12) onChange(1, year + 1)
    else onChange(month + 1, year)
  }

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {MONTHS[month - 1]} {year}
        </span>
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}