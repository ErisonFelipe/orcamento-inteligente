"""
Schemas para os dados agregados do Dashboard.
"""

from decimal import Decimal
from pydantic import BaseModel


class CategoryExpense(BaseModel):
    """Representa o total gasto em uma categoria específica."""
    category_id: int | None
    name: str
    color: str
    total: Decimal


class MonthlySummary(BaseModel):
    """Representa o total de receitas e despesas de um determinado mês."""
    month: str  # Formato "YYYY-MM" (ex: "2026-11")
    income: Decimal
    expense: Decimal


class DashboardSummary(BaseModel):
    """Payload completo devolvido para a tela de Dashboard."""
    expenses_by_category: list[CategoryExpense]
    monthly_summary: list[MonthlySummary]