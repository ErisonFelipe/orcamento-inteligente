import axios, { AxiosError } from "axios"

import type {
  TransactionCreate,
  TransactionFilters,
  TransactionListResult,
  TransactionRead,
  TransactionUpdate,
  TransactionPredictResult,
  TransactionBulkCreate,
} from "@/types/transaction"
import type {
  CategoryCreate,
  CategoryRead,
  CategoryUpdate,
} from "@/types/category"
import type { DashboardSummary, AnnualWealthSummary } from "@/types/dashboard"
import type { InvestmentCreate, InvestmentListResult, InvestmentRead, InvestmentUpdate, InvestmentBulkCreate } from "@/types/investment"

const API_BASE_URL = "/api/v1"

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(message: string, status: number, detail: unknown = null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(
        new ApiError("Sem conexão com o servidor. Verifique se o backend está rodando.", 0),
      )
    }

    const { status, data } = error.response
    const detail = (data as { detail?: unknown } | undefined)?.detail

    let message: string
    if (typeof detail === "string") {
      message = detail
    } else if (Array.isArray(detail)) {
      message = detail
        .map((e: { loc?: unknown; msg?: string }) => {
          const campo = Array.isArray(e.loc) ? e.loc.slice(1).join(".") : ""
          return campo ? `${campo}: ${e.msg ?? ""}` : e.msg ?? ""
        })
        .join("; ")
    } else {
      message = defaultMessageFor(status)
    }

    return Promise.reject(new ApiError(message, status, detail))
  },
)

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400: return "Requisição inválida."
    case 401: return "Não autenticado."
    case 403: return "Sem permissão."
    case 404: return "Recurso não encontrado."
    case 422: return "Dados inválidos."
    case 500: return "Erro interno do servidor."
    default: return `Erro inesperado (${status}).`
  }
}

// ============================================================
// API de Transações
// ============================================================

export const transactionsApi = {
  async list(filters: TransactionFilters = {}): Promise<TransactionListResult> {
    const response = await api.get<TransactionRead[]>("/transactions", {
      params: filters,
    })
    const totalHeader = response.headers["x-total-count"]
    const total = totalHeader ? Number(totalHeader) : response.data.length
    return { items: response.data, total }
  },

  async get(id: number): Promise<TransactionRead> {
    const response = await api.get<TransactionRead>(`/transactions/${id}`)
    return response.data
  },

  async create(payload: TransactionCreate): Promise<TransactionRead> {
    const response = await api.post<TransactionRead>("/transactions", payload)
    return response.data
  },

  async update(id: number, payload: TransactionUpdate): Promise<TransactionRead> {
    const response = await api.patch<TransactionRead>(`/transactions/${id}`, payload)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`)
  },

  async predictCategory(description: string): Promise<TransactionPredictResult> {
    const response = await api.post<TransactionPredictResult>(
      "/transactions/predict-category",
      { description }
    )
    return response.data
  },

  async createBulk(payload: TransactionBulkCreate): Promise<TransactionRead[]> {
    const response = await api.post<TransactionRead[]>("/transactions/bulk", payload)
    return response.data
  },
}

// ============================================================
// API de Categorias
// ============================================================

export const categoriesApi = {
  async list(): Promise<CategoryRead[]> {
    const response = await api.get<CategoryRead[]>("/categories")
    return response.data
  },

  async create(payload: CategoryCreate): Promise<CategoryRead> {
    const response = await api.post<CategoryRead>("/categories", payload)
    return response.data
  },

  async update(id: number, payload: CategoryUpdate): Promise<CategoryRead> {
    const response = await api.patch<CategoryRead>(`/categories/${id}`, payload)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/categories/${id}`)
  },
}

if (import.meta.env.DEV) {
  // @ts-expect-error - helper só de desenvolvimento
  window.__api = { transactionsApi, categoriesApi }
}

// ============================================================
// API do Dashboard
// ============================================================

export const dashboardApi = {
 async getSummary(month?: number, year?: number): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>("/dashboard/summary", {
      params: { month, year }
    })
    return response.data
  },
}

export const investmentsApi = {
  async list(): Promise<InvestmentListResult> {
    const response = await api.get<InvestmentRead[]>("/investments")
    const totalHeader = response.headers["x-total-count"]
    const total = totalHeader ? Number(totalHeader) : response.data.length
    return { items: response.data, total }
  },

  async create(payload: InvestmentCreate): Promise<InvestmentRead> {
    const response = await api.post<InvestmentRead>("/investments", payload)
    return response.data
  },

  async update(id: number, payload: InvestmentUpdate): Promise<InvestmentRead> {
    const response = await api.patch<InvestmentRead>(`/investments/${id}`, payload)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/investments/${id}`)
  },

   async createBulk(payload: InvestmentBulkCreate): Promise<InvestmentRead[]> {
    const response = await api.post<InvestmentRead[]>("/investments/bulk", payload)
    return response.data
  },
}

if (import.meta.env.DEV) {
  // @ts-expect-error - helper só de desenvolvimento
  window.__api = { transactionsApi, categoriesApi, dashboardApi, investmentsApi }
}