import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/services/api"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
  wealth: (year: number) => [...dashboardKeys.all, "wealth", year] as const,
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.getSummary(),
  })
}

export function useWealthSummary(year: number) {
  return useQuery({
    queryKey: dashboardKeys.wealth(year),
    queryFn: () => dashboardApi.getWealth(year),
  })
}