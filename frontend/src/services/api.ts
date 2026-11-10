/**
 * Cliente HTTP centralizado do frontend.
 *
 * Toda chamada ao backend passa por aqui. Componentes e hooks NUNCA devem
 * chamar `axios` ou `fetch` diretamente — sempre usar `transactionsApi`
 * (e, nas próximas etapas, `categoriesApi`, `budgetsApi`, etc.).
 *
 * Por que centralizar:
 *
 * - `baseURL`, `timeout` e headers comuns em um só lugar.
 * - Todo erro HTTP vira `ApiError` com mensagem amigável pronta para UI.
 *   (FastAPI devolve `{"detail": ...}`; o interceptor extrai e formata.)
 * - Testável: dá para mockar `transactionsApi.list` nos testes.
 *
 * Variável de ambiente:
 *   Em dev, `API_BASE_URL` aponta para o backend local (8000).
 *   Em deploy (Etapa 8), será configurada via `.env` do Vite
 *   (`import.meta.env.VITE_API_URL`).
 */

import axios, { AxiosError } from "axios"

import type {
  TransactionCreate,
  TransactionFilters,
  TransactionListResult,
  TransactionRead,
  TransactionUpdate,
} from "@/types/transaction"

// ============================================================
// Configuração base
// ============================================================

const API_BASE_URL = "http://localhost:8000/api/v1"

/**
 * Erro customizado para chamadas de API.
 *
 * Todo erro (HTTP ou de rede) que escapar das funções `transactionsApi.*`
 * será deste tipo. Isso permite que hooks e componentes tratem erro de forma
 * consistente (`err.message` para UI, `err.status` para decidir retry, etc.).
 */
export class ApiError extends Error {
  /** Código HTTP (0 = erro de rede / sem resposta). */
  readonly status: number
  /** Corpo de erro do backend (ex.: `{ detail: "..." }` ou lista de erros 422). */
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
  timeout: 10_000, // 10 segundos
  headers: { "Content-Type": "application/json" },
})

// ============================================================
// Interceptor de resposta: converte AxiosError em ApiError
// ============================================================

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Erro de rede (backend fora, DNS, timeout, CORS mal configurado)
    if (!error.response) {
      return Promise.reject(
        new ApiError("Sem conexão com o servidor. Verifique se o backend está rodando.", 0),
      )
    }

    const { status, data } = error.response
    const detail = (data as { detail?: unknown } | undefined)?.detail

    let message: string
    if (typeof detail === "string") {
      // FastAPI devolve {"detail": "mensagem"} para erros simples (404, 400)
      message = detail
    } else if (Array.isArray(detail)) {
      // FastAPI devolve {"detail": [{loc, msg, ...}, ...]} para 422 (validação)
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
// API de transações
// ============================================================

export const transactionsApi = {
  /**
   * Lista transações com filtros opcionais.
   * O backend devolve o array no corpo e o total no cabeçalho
   * `X-Total-Count` — combinamos os dois em `TransactionListResult`.
   */
  async list(filters: TransactionFilters = {}): Promise<TransactionListResult> {
    const response = await api.get<TransactionRead[]>("/transactions", {
      params: filters,
    })
    const totalHeader = response.headers["x-total-count"]
    const total = totalHeader ? Number(totalHeader) : response.data.length
    return { items: response.data, total }
  },

  /** Busca uma transação por ID. Lança `ApiError(404)` se não existir. */
  async get(id: number): Promise<TransactionRead> {
    const response = await api.get<TransactionRead>(`/transactions/${id}`)
    return response.data
  },

  /** Cria uma nova transação. */
  async create(payload: TransactionCreate): Promise<TransactionRead> {
    const response = await api.post<TransactionRead>("/transactions", payload)
    return response.data
  },

  /** Atualiza APENAS os campos enviados (PATCH parcial). */
  async update(id: number, payload: TransactionUpdate): Promise<TransactionRead> {
    const response = await api.patch<TransactionRead>(`/transactions/${id}`, payload)
    return response.data
  },

  /** Remove uma transação. */
  async delete(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`)
  },
}

// ============================================================
// Exposição em dev para debug pelo console do navegador
// ============================================================
// Em desenvolvimento, `window.__api.transactionsApi.list()` funciona no
// console do navegador. Em produção, este bloco é removido automaticamente
// (import.meta.env.DEV é `false` no build).
if (import.meta.env.DEV) {
  // @ts-expect-error - helper só de desenvolvimento
  window.__api = { transactionsApi }
}