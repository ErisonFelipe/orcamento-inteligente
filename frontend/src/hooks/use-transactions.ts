/**
 * Hooks de transações usando TanStack Query.
 *
 * Componentes NUNCA chamam `transactionsApi` diretamente — sempre usam
 * um destes hooks. Isso dá, de graça:
 *
 * - estado de loading (`isPending` / `isLoading`)
 * - estado de erro (`error`)
 * - cache inteligente (`staleTime`)
 * - retry automático
 * - invalidação de cache após mutations
 *
 * Convenção de nomenclatura:
 * - `useX` (query)  → leitura (GET)
 * - `useXMutation`  → escrita (POST/PATCH/DELETE)
 *
 * Aqui usamos `useCreateTransaction` em vez de `useCreateTransactionMutation`
 * porque o "verbo" já está no nome e é mais curto.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { transactionsApi } from "@/services/api"
import type {
  TransactionCreate,
  TransactionFilters,
  TransactionUpdate,
} from "@/types/transaction"

// ============================================================
// Chaves de query
// ============================================================
// Chaves são o "ID" do cache. A convenção "hierárquica" permite
// invalidar em massa com `invalidateQueries({ queryKey: ["transactions"] })`
// (todas as variantes) ou cirurgicamente com a chave específica.
//
// A `as const` faz o TS inferir tipos literais — obrigatório no TanStack v5.
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: number) => [...transactionKeys.details(), id] as const,
}

// ============================================================
// QUERIES (leitura)
// ============================================================

/**
 * Lista transações com filtros opcionais.
 *
 * @example
 *   const { data, isLoading, error } = useTransactions({ type: "expense" })
 *   if (isLoading) return <Spinner />
 *   if (error) return <ErrorBox error={error} />
 *   return data.items.map(...)
 */
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionsApi.list(filters),
  })
}

/**
 * Busca uma transação por ID. Só dispara se `id > 0` (`enabled`),
 * evitando fetch de `/transactions/0` ou `/transactions/NaN`.
 */
export function useTransaction(id: number) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsApi.get(id),
    enabled: id > 0,
  })
}

// ============================================================
// MUTATIONS (escrita)
// ============================================================

/**
 * Cria uma transação e invalida as listas no cache.
 *
 * Após o `onSuccess`, qualquer componente que usa `useTransactions`
 * verá os dados **atualizados automaticamente** — sem `window.reload`.
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TransactionCreate) => transactionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

/**
 * Atualiza parcialmente e invalida tanto a lista quanto o detalhe do ID.
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TransactionUpdate }) =>
      transactionsApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) })
    },
  })
}

/**
 * Remove uma transação e invalida as listas.
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}