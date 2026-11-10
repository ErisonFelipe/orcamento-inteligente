/**
 * Tipos TypeScript que espelham os schemas Pydantic do backend.
 *
 * Fonte da verdade: `backend/app/schemas/transaction.py` (Sub-etapa 2.6).
 *
 * Disciplinas importantes:
 *
 * - `amount` é `string`, não `number`. O backend envia Decimal
 *   serializado como string para preservar precisão monetária.
 *   Usar `number` faria o TS "mentir" — o dado real seria string.
 *
 * - `date` e `created_at`/`updated_at` são `string` (ISO 8601).
 *   Converta para `Date` só na hora de formatar para exibição.
 *
 * - `category` é `string | null` no Read, e `string | null | undefined`
 *   nos payloads de entrada (o backend aceita omitir).
 *
 * - Se o schema Python mudar, este arquivo PRECISA mudar junto.
 *   (Automatizar com geração de client OpenAPI fica para etapa futura.)
 */

/** Tipo de transação — espelha o Enum `TransactionType` do backend. */
export type TransactionType = "income" | "expense";

/**
 * Corpo do `POST /api/v1/transactions`.
 * Espelha `TransactionCreate` (todos os campos obrigatórios exceto `category`).
 */
export interface TransactionCreate {
  description: string;
  amount: string;
  type: TransactionType;
  category?: string | null;
  date: string;
}

/**
 * Corpo do `PATCH /api/v1/transactions/{id}`.
 * Espelha `TransactionUpdate` (todos os campos opcionais).
 */
export interface TransactionUpdate {
  description?: string;
  amount?: string;
  type?: TransactionType;
  category?: string | null;
  date?: string;
}

/**
 * Item retornado por `GET /api/v1/transactions` e `GET /api/v1/transactions/{id}`.
 * Espelha `TransactionRead`.
 */
export interface TransactionRead {
  id: number;
  description: string;
  amount: string;
  type: TransactionType;
  category: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Query params aceitos pelo `GET /api/v1/transactions`.
 * Nomes em `snake_case` para bater com o backend.
 */
export interface TransactionFilters {
  skip?: number;
  limit?: number;
  type?: TransactionType;
  category?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Formato combinado que o frontend usa para listagens paginadas.
 * O backend devolve o array no corpo e o total no cabeçalho
 * `X-Total-Count` — o cliente de API (3.3b) monta este objeto.
 */
export interface TransactionListResult {
  items: TransactionRead[];
  total: number;
}