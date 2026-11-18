import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import { useTransactions } from "@/hooks/use-transactions"
import { useDebounce } from "@/hooks/use-debounce"
import { MonthSelector } from "@/components/layout/month-selector"
import { TransactionsSummary } from "@/components/transactions/transactions-summary"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { TransactionsEmpty } from "@/components/transactions/transactions-empty"
import { TransactionsError } from "@/components/transactions/transactions-error"
import { TransactionsFilters } from "@/components/transactions/transactions-filters"
import { TransactionsPagination } from "@/components/transactions/transactions-pagination"
import {
  TransactionsListSkeleton,
  TransactionsSummarySkeleton,
} from "@/components/transactions/transactions-states"
import type { TransactionFilters, TransactionType } from "@/types/transaction"

const LIMIT = 50

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Lê os valores atuais da URL
  const page = Number(searchParams.get("page")) || 1
  const type = (searchParams.get("type") as TransactionType | null) ?? undefined
  const category = searchParams.get("category") ?? undefined
  const dateFrom = searchParams.get("date_from") ?? undefined
  const dateTo = searchParams.get("date_to") ?? undefined

  // Mês e Ano para o seletor visual (baseado no dateFrom da URL)
  const [currentDate, setCurrentDate] = useState(() => {
    if (dateFrom) {
      const [y, m] = dateFrom.split("-").map(Number)
      return { month: m, year: y }
    }
    const today = new Date()
    return { month: today.getMonth() + 1, year: today.getFullYear() }
  })

  const [searchCategory, setSearchCategory] = useState(category ?? "")
  const debouncedCategory = useDebounce(searchCategory, 500)

  useEffect(() => {
    if (debouncedCategory === (category ?? "")) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedCategory) next.set("category", debouncedCategory)
      else next.delete("category")
      next.set("page", "1")
      return next
    })
  }, [debouncedCategory, category, setSearchParams])

  // Função que o seletor chama ao mudar de mês
  function handleMonthChange(month: number, year: number) {
    setCurrentDate({ month, year })
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      
      // Calcula o primeiro e último dia do mês
      const from = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      
      next.set("date_from", from)
      next.set("date_to", to)
      next.set("page", "1")
      return next
    })
  }

  const filters: TransactionFilters = useMemo(() => {
    return {
      skip: (page - 1) * LIMIT,
      limit: LIMIT,
      type,
      category,
      date_from: dateFrom,
      date_to: dateTo,
    }
  }, [page, type, category, dateFrom, dateTo])

  const { data, isLoading, isError, error, refetch, isFetching } = useTransactions(filters)

  function handleFilterChange(newFilters: TransactionFilters) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === undefined || value === "") next.delete(key)
        else next.set(key, String(value))
      })
      next.set("page", "1")
      return next
    })
  }

  function handlePageChange(newPage: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", String(newPage))
      return next
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto flex justify-start">
          <MonthSelector 
            month={currentDate.month} 
            year={currentDate.year} 
            onChange={handleMonthChange} 
          />
        </div>
        <TransactionsFilters
          filters={{ type, category, date_from: dateFrom, date_to: dateTo }}
          onChange={handleFilterChange}
          searchCategory={searchCategory}
          onSearchCategoryChange={setSearchCategory}
        />
      </div>

      <div className={isFetching && !isLoading ? "opacity-60 transition-opacity" : ""}>
        {isLoading ? (
          <>
            <TransactionsSummarySkeleton />
            <div className="mt-6">
              <TransactionsListSkeleton rows={LIMIT} />
            </div>
          </>
        ) : isError ? (
          <TransactionsError error={error} onRetry={() => refetch()} />
        ) : (
          <>
            <TransactionsSummary items={data?.items ?? []} />

            {(data?.items?.length ?? 0) === 0 ? (
              <div className="mt-6">
                <TransactionsEmpty />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {data?.total} {data?.total === 1 ? "transação encontrada" : "transações encontradas"}
                </p>
                <TransactionsList items={data?.items ?? []} />
                
                <TransactionsPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}