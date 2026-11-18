"""
Endpoints para o Dashboard (dados agregados, previsão e patrimônio).
"""

import calendar
from datetime import date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, case
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.models.investment import Investment
from app.schemas.dashboard import (
    CategoryExpense,
    DashboardSummary,
    MonthlySummary,
    ForecastInfo,
    AnnualWealthSummary,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Annotated[Session, Depends(get_db)],
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
):
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year
    
    # Define o primeiro e o último dia do mês selecionado
    first_day = date(target_year, target_month, 1)
    last_day = date(target_year, target_month, calendar.monthrange(target_year, target_month)[1])
    
    target_month_str = f"{target_year}-{str(target_month).padStart(2, '0')}"

    # 1. Gastos por Categoria (Filtrado pelo mês)
    stmt_cat = (
        select(
            Category.id.label("category_id"),
            func.coalesce(Category.name, "Sem categoria").label("name"),
            func.coalesce(Category.color, "#94a3b8").label("color"),
            func.sum(Transaction.amount).label("total"),
        )
        .select_from(Transaction)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(Transaction.type == TransactionType.EXPENSE)
        .where(Transaction.date >= first_day)
        .where(Transaction.date <= last_day)
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

    # Total Investido (Global, não filtra por mês)
    total_invested_stmt = select(
        func.sum(
            case(
                (Investment.current_value.isnot(None), Investment.current_value),
                else_=Investment.amount
            )
        )
    )
    total_invested = db.scalar(total_invested_stmt) or Decimal(0)

    if total_invested > 0:
        expenses_by_category.append(
            CategoryExpense(
                category_id=None,
                name="Investimentos",
                color="#8b5cf6",
                total=total_invested
            )
        )

    # 2. Resumo Mensal (Apenas do mês selecionado para os cards)
    stmt_monthly = (
        select(
            func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)).label("income"),
            func.sum(case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)).label("expense")
        )
        .where(Transaction.date >= first_day)
        .where(Transaction.date <= last_day)
    )
    res_monthly = db.execute(stmt_monthly).first()
    
    month_income = Decimal(res_monthly.income or 0)
    month_expense = Decimal(res_monthly.expense or 0)

    # O monthly_summary é usado para o gráfico de barras de evolução. 
    # Vamos pegar os últimos 6 meses para manter o gráfico bonito.
    month_col = func.to_char(Transaction.date, 'YYYY-MM').label('month')
    stmt_history = (
        select(
            month_col,
            func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)).label("income"),
            func.sum(case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)).label("expense")
        )
        .group_by(month_col)
        .order_by(month_col.asc())
    )
    history_result = db.execute(stmt_history).all()
    monthly_summary = [
        MonthlySummary(month=row.month, income=row.income, expense=row.expense)
        for row in history_result
    ]

    # 3. Cálculo de Previsão (Só faz sentido se o mês selecionado for o mês atual)
    daily_average = Decimal(0)
    projected_expense = month_expense
    projected_balance = month_income - month_expense
    alert_message = None
    current_day = 1
    
    if target_month == today.month and target_year == today.year:
        current_day = today.day
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        daily_average = month_expense / current_day if current_day > 0 else Decimal(0)
        projected_expense = daily_average * days_in_month
        projected_balance = month_income - projected_expense

        if projected_balance < 0:
            alert_message = "Atenção: No ritmo atual de gastos, seu saldo ficará negativo até o fim do mês."
        elif month_income > 0 and month_expense > (month_income * Decimal('0.8')):
            alert_message = "Cuidado: Você já gastou mais de 80% da sua receita deste mês."

    forecast = ForecastInfo(
        current_day=current_day,
        days_in_month=calendar.monthrange(target_year, target_month)[1],
        daily_average=round(daily_average, 2),
        projected_expense=round(projected_expense, 2),
        projected_balance=round(projected_balance, 2),
        alert_message=alert_message
    )

    return DashboardSummary(
        expenses_by_category=expenses_by_category,
        monthly_summary=monthly_summary,
        forecast=forecast,
        total_invested=total_invested
    )


@router.get("/wealth", response_model=AnnualWealthSummary)
def get_annual_wealth(
    db: Annotated[Session, Depends(get_db)],
    year: int = date.today().year,
):
    # ... (código da rota /wealth mantido igual ao anterior) ...
    # 1. Totais de Transações no Ano
    stmt_transactions = (
        select(
            func.sum(case((Transaction.type == TransactionType.INCOME, Transaction.amount), else_=0)).label("income"),
            func.sum(case((Transaction.type == TransactionType.EXPENSE, Transaction.amount), else_=0)).label("expense")
        )
        .where(func.extract('year', Transaction.date) == year)
    )
    res_trans = db.execute(stmt_transactions).first()
    total_income = Decimal(res_trans.income or 0)
    total_expense = Decimal(res_trans.expense or 0)

    # 2. Total Investido Global
    stmt_investments = select(
        func.sum(
            case(
                (Investment.current_value.isnot(None), Investment.current_value),
                else_=Investment.amount
            )
        )
    )
    total_invested = Decimal(db.scalar(stmt_investments) or 0)

    # 3. Matemática do Patrimônio
    liquid_cash = total_income - total_expense
    net_worth = liquid_cash + total_invested

    # 4. Projeção Anual
    projected_income = total_income
    projected_expense = total_expense
    today = date.today()
    
    if year == today.year and today.month > 0:
        avg_monthly_income = total_income / today.month
        avg_monthly_expense = total_expense / today.month
        projected_income = avg_monthly_income * 12
        projected_expense = avg_monthly_expense * 12

    projected_savings = projected_income - projected_expense

    return AnnualWealthSummary(
        year=year,
        total_income=total_income,
        total_expense=total_expense,
        liquid_cash=liquid_cash,
        total_invested=total_invested,
        net_worth=net_worth,
        projected_annual_income=round(projected_income, 2),
        projected_annual_expense=round(projected_expense, 2),
        projected_annual_savings=round(projected_savings, 2)
    )