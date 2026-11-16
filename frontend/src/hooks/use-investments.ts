import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { investmentsApi } from "@/services/api"
import type { InvestmentCreate, InvestmentUpdate, InvestmentBulkCreate } from "@/types/investment"

export const investmentKeys = {
  all: ["investments"] as const,
  lists: () => [...investmentKeys.all, "list"] as const,
}

export function useInvestments() {
  return useQuery({
    queryKey: investmentKeys.lists(),
    queryFn: () => investmentsApi.list(),
  })
}

export function useCreateInvestment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InvestmentCreate) => investmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
    },
  })
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InvestmentUpdate }) =>
      investmentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
    },
  })
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => investmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
    },
  })
}

export function useCreateBulkInvestment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InvestmentBulkCreate) => investmentsApi.createBulk(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
      // Também atualiza o dashboard e patrimônio, pois o total investido mudou
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
