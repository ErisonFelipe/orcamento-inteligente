import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import { useTransactions } from "@/hooks/use-transactions"
import { useDebounce } from "@/hooks/use-debounce"
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

const LIMIT = 50 // Itens por página (baixo para testarmos a paginação rápido)

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Lê os valores atuais da URL
  const page = Number(searchParams.get("page")) || 1
  const type = (searchParams.get("type") as TransactionType | null) ?? undefined
  const category = searchParams.get("category") ?? undefined
  const dateFrom = searchParams.get("date_from") ?? undefined
  const dateTo = searchParams.get("date_to") ?? undefined

  // 2. Estado local apenas para o input de texto (antes do debounce)
  const [searchCategory, setSearchCategory] = useState(category ?? "")
  
  // Debounce da busca por texto
  const debouncedCategory = useDebounce(searchCategory, 500)

  // 3. Efeito para sincronizar o input com o debounce na URL
  useEffect(() => {
    // Se a URL já tem o valor (ex: ao recarregar), não faz nada
    if (debouncedCategory === (category ?? "")) return

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedCategory) {
        next.set("category", debouncedCategory)
      } else {
        next.delete("category")
      }
      next.set("page", "1") // Sempre volta pra pág 1 ao filtrar
      return next
    })
  }, [debouncedCategory, category, setSearchParams])

  // 4. Constrói o objeto de filtros para o backend
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

  // 5. Busca os dados
  const { data, isLoading, isError, error, refetch, isFetching } =
    useTransactions(filters)

  // 6. Funções que alteram a URL
  function handleFilterChange(newFilters: TransactionFilters) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      
      // Atualiza cada filtro
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      })
      
      next.set("page", "1") // Volta pra pág 1 ao mudar qualquer filtro
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
      <TransactionsFilters
        filters={{ type, category, date_from: dateFrom, date_to: dateTo }}
        onChange={handleFilterChange}
        searchCategory={searchCategory}
        onSearchCategoryChange={setSearchCategory}
      />

      {/* Opacity reduzida enquanto busca em background */}
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