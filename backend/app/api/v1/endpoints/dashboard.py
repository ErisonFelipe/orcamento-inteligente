"""
Endpoints para o Dashboard (dados agregados).
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy import case

from app.db.session import get_db
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.schemas.dashboard import (
    CategoryExpense,
    DashboardSummary,
    MonthlySummary,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Annotated[Session, Depends(get_db)],
):
    """
    Retorna os dados agregados para os gráficos do Dashboard.
    """
    
    # 1. Gastos por Categoria (Apenas despesas)
    # Faz um LEFT JOIN com categorias para pegar o nome e a cor
    stmt_cat = (
        select(
            Category.id.label("category_id"),
            func.coalesce(Category.name, "Sem categoria").label("name"),
            func.coalesce(Category.color, "#94a3b8").label("color"), # Cinza padrão se não tiver categoria
            func.sum(Transaction.amount).label("total"),
        )
        .select_from(Transaction)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(Transaction.type == TransactionType.EXPENSE)
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
    )
    
    expenses_result = db.execute(stmt_cat).all()
    expenses_by_category = [
        CategoryExpense(
            category_id=row.category_id,
            name=row.name,
            color=row.color,
            total=row.total
        ) for row in expenses_result
    ]

    # 2. Resumo Mensal (Receitas e Despesas ao longo dos meses)
    # Usa o to_char do PostgreSQL para agrupar por "AAAA-MM"
    month_col = func.to_char(Transaction.date, 'YYYY-MM').label('month')
    
    stmt_monthly = (
        select(
            month_col,
            func.sum(
                case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)
            ).label("income"),
            func.sum(
                case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)
            ).label("expense")
        )
        .group_by(month_col)
        .order_by(month_col.asc())
    )
    
    monthly_result = db.execute(stmt_monthly).all()
    monthly_summary = [
        MonthlySummary(
            month=row.month,
            income=row.income,
            expense=row.expense
        ) for row in monthly_result
    ]

    return DashboardSummary(
        expenses_by_category=expenses_by_category,
        monthly_summary=monthly_summary
    )