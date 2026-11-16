import type { CategoryRead } from "./category"

export type TransactionType = "income" | "expense";

export interface TransactionCreate {
  description: string;
  amount: string;
  type: TransactionType;
  category_id?: number | null; // Mudou de string para number
  date: string;
}

export interface TransactionUpdate {
  description?: string;
  amount?: string;
  type?: TransactionType;
  category_id?: number | null; // Mudou de string para number
  date?: string;
}

export interface TransactionRead {
  id: number;
  description: string;
  amount: string;
  type: TransactionType;
  category_id: number | null;
  category: CategoryRead | null; // Objeto aninhado que o backend envia
  date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  skip?: number;
  limit?: number;
  type?: TransactionType;
  category?: string; // Filtro por NOME (usado na URL e query params)
  date_from?: string;
  date_to?: string;
}

export interface TransactionListResult {
  items: TransactionRead[];
  total: number;
}

export interface TransactionPredictResult {
  category_id: number | null;
}

export interface TransactionBulkCreate {
  items: TransactionCreate[];
}