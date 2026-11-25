import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/services/api"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (month?: number, year?: number) => [...dashboardKeys.all, "summary", month, year] as const,
  wealth: (year: number) => [...dashboardKeys.all, "wealth", year] as const,
  cashflow: (months: number) => [...dashboardKeys.all, "cashflow", months] as const,
  projection: () => [...dashboardKeys.all, "projection"] as const, // <-- Nova chave
}

export function useDashboardSummary(month?: number, year?: number) {
  return useQuery({
    queryKey: dashboardKeys.summary(month, year),
    queryFn: () => dashboardApi.getSummary(month, year),
  })
}

export function useWealthSummary(year: number) {
  return useQuery({
    queryKey: dashboardKeys.wealth(year),
    queryFn: () => dashboardApi.getWealth(year),
  })
}

export function useCashflowForecast(months: number = 6) {
  return useQuery({
    queryKey: dashboardKeys.cashflow(months),
    queryFn: () => dashboardApi.getCashflow(months),
  })
}

export function useFinancialProjection() {
  return useQuery({
    queryKey: dashboardKeys.projection(),
    queryFn: () => dashboardApi.getProjection(),
  })
}