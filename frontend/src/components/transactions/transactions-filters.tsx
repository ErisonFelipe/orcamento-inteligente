import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TransactionFilters, TransactionType } from "@/types/transaction"

type TransactionsFiltersProps = {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
  searchCategory: string
  onSearchCategoryChange: (value: string) => void
}

export function TransactionsFilters({
  filters,
  onChange,
  searchCategory,
  onSearchCategoryChange,
}: TransactionsFiltersProps) {
  const hasFilters = Boolean(
    filters.type || filters.category || filters.date_from || filters.date_to
  )

  function handleClear() {
    onChange({})
    onSearchCategoryChange("")
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
      {/* Filtro por Tipo */}
      <div className="space-y-1.5 flex-1 min-w-[150px]">
        <Label htmlFor="filter-type" className="text-xs">Tipo</Label>
        <Select
          value={filters.type || "all"}
          onValueChange={(val) => {
            onChange({
              ...filters,
              type: val === "all" ? undefined : (val as TransactionType),
            })
          }}
        >
          <SelectTrigger id="filter-type" className="h-9">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por Categoria (Busca) */}
      <div className="space-y-1.5 flex-[2] min-w-[200px]">
        <Label htmlFor="filter-category" className="text-xs">Categoria</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="filter-category"
            placeholder="Ex.: Alimentação"
            className="h-9 pl-9"
            value={searchCategory}
            onChange={(e) => onSearchCategoryChange(e.target.value)}
          />
        </div>
      </div>

      {/* Data Início */}
      <div className="space-y-1.5 flex-1 min-w-[130px]">
        <Label htmlFor="filter-date-from" className="text-xs">De</Label>
        <Input
          id="filter-date-from"
          type="date"
          className="h-9"
          value={filters.date_from || ""}
          onChange={(e) => {
            onChange({ ...filters, date_from: e.target.value || undefined })
          }}
        />
      </div>

      {/* Data Fim */}
      <div className="space-y-1.5 flex-1 min-w-[130px]">
        <Label htmlFor="filter-date-to" className="text-xs">Até</Label>
        <Input
          id="filter-date-to"
          type="date"
          className="h-9"
          value={filters.date_to || ""}
          onChange={(e) => {
            onChange({ ...filters, date_to: e.target.value || undefined })
          }}
        />
      </div>

      {/* Botão Limpar */}
      <Button
        variant="ghost"
        className="h-9 px-3 text-muted-foreground"
        onClick={handleClear}
        disabled={!hasFilters && !searchCategory}
        title="Limpar filtros"
      >
        <X className="h-4 w-4 mr-2" />
        Limpar
      </Button>
    </div>
  )
}