"""
Schemas para os dados agregados do Dashboard.
"""

from decimal import Decimal
from pydantic import BaseModel


class CategoryExpense(BaseModel):
    category_id: int | None
    name: str
    color: str
    total: Decimal


class MonthlySummary(BaseModel):
    month: str
    income: Decimal
    expense: Decimal


class ForecastInfo(BaseModel):
    current_day: int
    days_in_month: int
    daily_average: Decimal
    projected_expense: Decimal
    projected_balance: Decimal
    alert_message: str | None


class DashboardSummary(BaseModel):
    expenses_by_category: list[CategoryExpense]
    monthly_summary: list[MonthlySummary]
    forecast: ForecastInfo | None
    total_invested: Decimal


# --- NOVOS SCHEMAS PARA PATRIMÔNIO ANUAL ---

class AnnualWealthSummary(BaseModel):
    """Resumo macro do patrimônio no ano selecionado."""
    year: int
    total_income: Decimal
    total_expense: Decimal
    
    current_cash: Decimal      # NOVO: Dinheiro em conta hoje
    projected_cash: Decimal    # NOVO: Dinheiro em conta no fim do ano
    
    total_invested: Decimal
    net_worth: Decimal         # Patrimônio Líquido HOJE
    
    projected_annual_income: Decimal
    projected_annual_expense: Decimal
    projected_annual_savings: Decimal
    
class CashflowMonth(BaseModel):
    month: str  # Formato "YYYY-MM"
    balance: Decimal # Saldo projetado ao final do mês

class CashflowForecast(BaseModel):
    current_balance: Decimal
    forecast: list[CashflowMonth]