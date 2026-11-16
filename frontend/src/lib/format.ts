/**
 * Utilitários de formatação (moeda, data) e cálculos agregados.
 *
 * Por que centralizar:
 * - Consistência visual: TODOS os valores monetários seguem o mesmo padrão
 *   brasileiro (`R$ 1.234,56`), sem repetir `Intl.NumberFormat` em cada card.
 * - Uma única fonte de verdade para trocar de locale ou formato.
 * - `amount` vem do backend como STRING (Decimal). Aqui fazemos a conversão
 *   segura para número, e formatamos como moeda.
 *
 * Nenhuma dependência externa: `Intl.NumberFormat` é nativo do navegador.
 */

import type { TransactionRead, TransactionType } from "@/types/transaction"

// ============================================================
// Moeda
// ============================================================

/**
 * Formatador de moeda brasileira (criado uma vez, reutilizado sempre).
 *
 * Exemplos:
 *   brlFormatter.format(42.75)     -> "R$ 42,75"
 *   brlFormatter.format(5000)      -> "R$ 5.000,00"
 *   brlFormatter.format(1234567.89)-> "R$ 1.234.567,89"
 */
const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

/**
 * Formata um valor monetário (string do backend, ou número) como BRL.
 * Retorna "—" se o valor não for numérico (defesa contra dados corrompidos).
 */
export function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value
  if (!Number.isFinite(num)) return "—"
  return brlFormatter.format(num)
}

/**
 * Formata com sinal (+/-) baseado no tipo da transação.
 *
 * Exemplos:
 *   formatTransactionAmount("5000.00", "income")  -> "+ R$ 5.000,00"
 *   formatTransactionAmount("42.75",  "expense")  -> "- R$ 42,75"
 */
export function formatTransactionAmount(
  amount: string,
  type: TransactionType,
): string {
  const sign = type === "income" ? "+" : "-"
  return `${sign} ${formatCurrency(amount)}`
}

// ============================================================
// Data
// ============================================================

const MONTHS_PT_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const

/**
 * Formata uma data ISO (`YYYY-MM-DD`) como "10 nov 2026".
 *
 * Por que NÃO usar `new Date(isoDate)` diretamente?
 *   `new Date("2026-11-10")` é interpretado como UTC meia-noite.
 *   Em timezones negativas (Brasil é UTC-3), exibiria 09/11/2026.
 *   Para evitar o bug, construímos a data a partir dos componentes
 *   ano/mês/dia locais.
 *
 * Por que não `Intl.DateTimeFormat` com month: "short"?
 *   Em pt-BR ele gera "10 de nov. de 2026" (com "de" e ponto). A
 *   array de meses nos dá controle total do formato exibido.
 */
export function formatDate(isoDate: string): string {
  const parts = isoDate.split("-")
  if (parts.length !== 3) return isoDate
  const [year, month, day] = parts.map(Number)
  if (!year || !month || !day || month < 1 || month > 12) return isoDate
  const monthName = MONTHS_PT_SHORT[month - 1]
  return `${String(day).padStart(2, "0")} ${monthName} ${year}`
}

// ============================================================
// Cálculos auxiliares
// ============================================================

/**
 * Calcula os totais de uma lista de transações.
 *
 * Retorna:
 * - income:  soma das receitas
 * - expense: soma das despesas (POSITIVA, para exibição)
 * - balance: income - expense
 *
 * Os valores são strings com 2 casas, para reaproveitar `formatCurrency`
 * (que aceita string) e manter o contrato "amount como string".
 *
 * Nota técnica: para somas de poucos itens (MVP), `Number` + `toFixed(2)`
 * é suficiente. Se um dia somarmos milhares de valores com centavos,
 * trocar por `decimal.js` para precisão exata. Anotado para a Etapa 5.
 */
export function calculateTotals(items: TransactionRead[]) {
  let income = 0
  let expense = 0

  for (const t of items) {
    const value = Number(t.amount)
    if (!Number.isFinite(value)) continue
    if (t.type === "income") income += value
    else expense += value
  }

  return {
    income: income.toFixed(2),
    expense: expense.toFixed(2),
    balance: (income - expense).toFixed(2),
  }
}

/**
 * Soma meses a uma data ISO "YYYY-MM-DD".
 * Cuidado com meses que não têm dia 31 (ex: 31/01 -> 28/02).
 */
export function addMonths(isoDate: string, months: number): string {
  const parts = isoDate.split("-")
  if (parts.length !== 3) return isoDate
  const [year, month, day] = parts.map(Number)
  
  const date = new Date(year, month - 1 + months, day)
  // Ajusta se o dia do mês mudou (ex: 31/01 + 1 mês = 02/03)
  if (date.getDate() !== day) {
    date.setDate(0) // Volta para o último dia do mês anterior
  }
  
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ... (bloco window.__format) ...

// ============================================================
// Exposição em dev para testar pelo console
// ============================================================
if (import.meta.env.DEV && typeof window !== "undefined") {
  // @ts-expect-error - helper só de desenvolvimento
  window.__format = {
    formatCurrency,
    formatTransactionAmount,
    formatDate,
    calculateTotals,
  }
}