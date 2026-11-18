import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/services/api"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (month?: number, year?: number) => [...dashboardKeys.all, "summary", month, year] as const,
  wealth: (year: number) => [...dashboardKeys.all, "wealth", year] as const,
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