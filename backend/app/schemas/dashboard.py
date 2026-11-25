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


class AnnualWealthSummary(BaseModel):
    year: int
    total_income: Decimal
    total_expense: Decimal
    current_cash: Decimal
    projected_cash: Decimal
    total_invested: Decimal
    net_worth: Decimal
    projected_annual_income: Decimal
    projected_annual_expense: Decimal
    projected_annual_savings: Decimal


class CashflowMonth(BaseModel):
    month: str
    balance: Decimal


class CashflowForecast(BaseModel):
    current_balance: Decimal
    forecast: list[CashflowMonth]


class ProjectionMonth(BaseModel):
    month: str
    projected_balance: Decimal
    projected_income: Decimal
    projected_expense: Decimal
    alert_message: str | None = None


class ProjectionResponse(BaseModel):
    current_balance: Decimal
    average_monthly_net: Decimal
    projection: list[ProjectionMonth]