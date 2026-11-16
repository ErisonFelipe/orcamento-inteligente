export interface InvestmentCreate {
  name: string;
  type: string;
  amount: string;
  date: string;
}

export interface InvestmentUpdate {
  name?: string;
  type?: string;
  amount?: string;
  date?: string;
}

export interface InvestmentRead {
  id: number;
  name: string;
  type: string;
  amount: string;
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