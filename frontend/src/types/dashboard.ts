export interface CategoryExpense {
  category_id: number | null;
  name: string;
  color: string;
  total: string;
}

export interface MonthlySummary {
  month: string;
  income: string;
  expense: string;
}

export interface ForecastInfo {
  current_day: number;
  days_in_month: number;
  daily_average: string;
  projected_expense: string;
  projected_balance: string;
  alert_message: string | null;
}

export interface DashboardSummary {
  expenses_by_category: CategoryExpense[];
  monthly_summary: MonthlySummary[];
  forecast: ForecastInfo | null;
  total_invested: string;
}

export interface AnnualWealthSummary {
  year: number;
  total_income: string;
  total_expense: string;
  liquid_cash: string;
  total_invested: string;
  net_worth: string;
  projected_annual_income: string;
  projected_annual_expense: string;
  projected_annual_savings: string;
}

export interface CashflowMonth {
  month: string;
  balance: string;
}

export interface CashflowForecast {
  current_balance: string;
  forecast: CashflowMonth[];
}