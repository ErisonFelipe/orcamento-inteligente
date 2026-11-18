export interface InvestmentCreate {
  name: string;
  type: string;
  amount: string;
  date: string;
  current_value?: string | null;
}

export interface InvestmentUpdate {
  name?: string;
  type?: string;
  amount?: string;
  date?: string;
  current_value?: string | null;
}

export interface InvestmentRead {
  id: number;
  name: string;
  type: string;
  amount: string;
  current_value: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentListResult {
  items: InvestmentRead[];
  total: number;
}

export interface InvestmentBulkCreate {
  items: InvestmentCreate[];
}