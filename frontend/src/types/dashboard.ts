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
  current_cash: string;
  projected_cash: string;
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

export interface ProjectionMonth {
  month: string;
  projected_balance: string;
  projected_income: string;
  projected_expense: string;
  alert_message: string | null;
}

export interface ProjectionResponse {
  current_balance: string;
  average_monthly_net: string;
  projection: ProjectionMonth[];
}

export interface RecurringExpense {
  description: string;
  average_amount: string;
  category_name: string | null;
  category_color: string | null;
  next_estimated_date: string;
  months_detected: number;
}

export interface RecurringExpensesResponse {
  total_monthly: string;
  expenses: RecurringExpense[];
}